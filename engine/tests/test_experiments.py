import json
import shutil

import pytest

from rw import experiments


@pytest.fixture(autouse=True)
def isolated(tmp_path, monkeypatch):
    monkeypatch.setenv("RW_HOME", str(tmp_path / "var"))


@pytest.fixture
def root(tmp_path):
    out = tmp_path / "experiments"
    out.mkdir()
    shutil.copy(experiments.EXPERIMENTS / "REGISTRY.md", out)
    for exp_id in ("E001", "E002", "E003", "E006"):
        (out / exp_id).mkdir()
        shutil.copy(experiments.EXPERIMENTS / exp_id / "PREREG.md", out / exp_id)
    return out


def test_registered_hashes_match():
    for exp_id in experiments.registry():
        experiments.check_registration(exp_id)


def test_hash_mismatch_refuses_to_run(root):
    prereg = root / "E003" / "PREREG.md"
    prereg.write_text(prereg.read_text() + "\nA change after registration.\n")
    with pytest.raises(experiments.NotRegistered, match="does not match REGISTRY.md"):
        experiments.run("E003", root=root)
    assert not (root / "E003" / "results").exists()


def test_unregistered_experiment_refuses(root):
    (root / "E999").mkdir()
    (root / "E999" / "PREREG.md").write_text("# E999\n")
    with pytest.raises(experiments.NotRegistered, match="no row"):
        experiments.run("E999", root=root)


def test_missing_data_names_input_and_section(root):
    for exp_id in ("E001", "E002"):
        with pytest.raises(experiments.MissingInput, match="section '## Data'"):
            experiments.run(exp_id, root=root)
    assert experiments.main(["run", "E002"]) == 1


def test_e003_assimilation_beats_control_on_fixed_seed():
    rows = experiments.e003_seed(0)
    day30 = {r["arm"]: r for r in rows if r["day"] == experiments.E003_DAYS}
    day1 = {r["arm"]: r for r in rows if r["day"] == 1}
    assert day30["nudge"]["rmse_logit"] < day30["none"]["rmse_logit"]
    assert day30["nudge"]["rmse_logit"] < day1["nudge"]["rmse_logit"]
    assert day30["none"]["zero_evidence_min_variance_ratio"] >= 1 - 1e-9


def test_v2_arms_leave_the_e003_arms_unchanged():
    plain = experiments.e003_seed(0, days=12)
    both = experiments.e003_seed(0, days=12, v2_walk_sds=experiments.E006_V2_ARMS)
    keep = ("seed", "day", "arm", "rmse_logit", "rmse_logit_never_observed")
    shared = [{k: r[k] for k in keep} for r in both if r["arm"] in ("none", "nudge", "persistence")]
    assert shared == [{k: r[k] for k in keep} for r in plain]
    day12 = {r["arm"]: r for r in both if r["day"] == 12}
    assert set(day12) == {"none", "nudge", "persistence", *experiments.E006_V2_ARMS}
    assert day12["v2"]["rmse_logit"] < day12["nudge"]["rmse_logit"]
    assert day12["v2"]["max_within_sd_change"] < 1e-9
    assert day12["v2"]["filter_sd_logit"] > 0


def test_e006_writes_every_pre_registered_metric(root, monkeypatch):
    monkeypatch.setattr(experiments, "E006_SEEDS", range(1000, 1003))
    path = experiments.run("E006", root=root)
    results = json.loads((path / "results.json").read_text())
    assert results["prereg_sha256"] == experiments.registry(root)["E006"]["sha256"]
    assert results["seeds"] == [1000, 1001, 1002] and results["cost_usd"] == 0.0
    metrics = results["metrics"]
    assert metrics["primary_day30_rmse_v2_minus_persistence"]["verdict"] in (
        "supported",
        "not supported",
    )
    for name in (
        "day30_rmse_v2_minus_nudge",
        "day30_rmse_v2_minus_none",
        "never_observed_day30_rmse_v2_minus_none",
        "day30_rmse_v2_walk_half_minus_persistence",
        "day30_rmse_v2_walk_double_minus_persistence",
        "day30_rmse_over_filter_sd_v2",
        "day30_max_within_segment_sd_change_v2",
        "zero_evidence_variance_does_not_shrink",
    ):
        assert name in metrics
    assert len(metrics["rmse_logit_by_day"]) == 6
    report = (path / "RESULTS.md").read_text()
    assert "v2 minus persistence" in report and "Decision 0005" in report
    rows = (path / "rows.csv").read_text().splitlines()
    assert len(rows) == 1 + 3 * experiments.E003_DAYS * 6


def test_e003_writes_every_result_field(root):
    path = experiments.run("E003", root=root)
    assert path.parent == root / "E003" / "results" and path.name.endswith("-none")
    results = json.loads((path / "results.json").read_text())
    fields = {
        "experiment", "command", "started_at", "git_commit", "prereg_sha256", "engine_version",
        "provider", "model", "cost_usd", "n", "seeds", "metrics", "deviations",
    }  # fmt: skip
    assert fields <= results.keys()
    assert results["prereg_sha256"] == experiments.registry(root)["E003"]["sha256"]
    assert results["n"] == len(results["seeds"]) == experiments.E003_SEEDS
    assert results["provider"] == "none" and results["cost_usd"] == 0.0
    primary = results["metrics"]["primary_day30_rmse_nudge_minus_none"]
    assert primary["high"] < 0 and primary["verdict"] == "supported"
    assert len(results["metrics"]["rmse_logit_by_day"]["nudge"]) == experiments.E003_DAYS

    report = (path / "RESULTS.md").read_text()
    for name in ("Primary", "never observed", "persistence", "ETKF", "Spread-skill", "Zero-evid"):
        assert name in report
    assert experiments.FAKE_NOTE not in report
    rows = (path / "rows.csv").read_text().splitlines()
    assert len(rows) == 1 + experiments.E003_SEEDS * experiments.E003_DAYS * 3


def test_e001_fixtures_label_fake_results(root):
    path = experiments.run("E001", fixtures=True, root=root)
    results = json.loads((path / "results.json").read_text())
    assert path.name.endswith("-fake") and results["provider"] == "fake"
    assert results["model"] == "fake" and results["n"] == 5 and results["cost_usd"] > 0
    assert {"mean_brier_sim", "brier_sim_minus_plain_llm", "brier_sim_minus_naive"} <= set(
        results["metrics"]
    )
    report = (path / "RESULTS.md").read_text()
    assert experiments.FAKE_NOTE in report
    # A keyless run prints its would-be dollars only as an estimate, never as spend (#33, #34).
    assert "- Cost: fake model, nothing spent (estimated $" in report


def test_list_says_hash_mismatch_in_lower_case_and_a_refusal_names_its_effect(monkeypatch, capsys):
    def mismatch(*_args):
        raise experiments.NotRegistered("hash differs")

    monkeypatch.setattr(experiments, "check_registration", mismatch)
    assert experiments.main(["list"]) == 0
    out = capsys.readouterr().out
    assert "hash mismatch" in out and "MISMATCH" not in out

    assert experiments.main(["run", "E002"]) == 1
    assert capsys.readouterr().err.startswith("experiment refused, nothing written: ")
