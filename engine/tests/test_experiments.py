import json
import shutil

import pytest

from rw import experiments


@pytest.fixture(autouse=True)
def isolated(tmp_path, monkeypatch):
    monkeypatch.setenv("RW_HOME", str(tmp_path / "var"))
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)


@pytest.fixture
def root(tmp_path):
    out = tmp_path / "experiments"
    out.mkdir()
    shutil.copy(experiments.EXPERIMENTS / "REGISTRY.md", out)
    for exp_id in ("E001", "E002", "E003"):
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
    (root / "E009").mkdir()
    (root / "E009" / "PREREG.md").write_text("# E009\n")
    with pytest.raises(experiments.NotRegistered, match="no row"):
        experiments.run("E009", root=root)


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
    assert experiments.FAKE_NOTE in (path / "RESULTS.md").read_text()
