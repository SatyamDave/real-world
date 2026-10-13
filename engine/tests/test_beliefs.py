import numpy as np
import pytest

from rw.beliefs import kalman_update, logit, nudge, spread_audit, update_beliefs
from rw.settings import ANCHOR_PULL, NUDGE_CAP_LOGIT, SPREAD_BAND, STEP_CAP_LOGIT

SEEDS = range(25)
N_TOPICS = 8


def random_world(rng, n=None):
    n = n or int(rng.integers(20, 400))
    B0 = rng.normal(0, 1.5, (n, N_TOPICS))
    B = B0 + rng.normal(0, 0.5, (n, N_TOPICS))
    s = rng.uniform(0, 1, n)
    return B, B0, s


def random_signal(rng, n):
    shape = (N_TOPICS,) if rng.random() < 0.5 else (n, N_TOPICS)
    return rng.normal(0, 2.0, shape)


def test_zero_signal_at_anchor_leaves_beliefs_unchanged():
    for seed in SEEDS:
        rng = np.random.default_rng(seed)
        _, B0, s = random_world(rng)
        exposed = rng.random(len(s)) < 0.5
        after = update_beliefs(B0.copy(), B0, s, np.zeros(N_TOPICS), exposed)
        np.testing.assert_array_equal(after, B0)


def test_update_returns_a_new_array_and_leaves_inputs_alone():
    rng = np.random.default_rng(0)
    B, B0, s = random_world(rng)
    before = B.copy()
    after = update_beliefs(B, B0, s, random_signal(rng, len(s)), np.ones(len(s), bool))
    assert after is not B
    np.testing.assert_array_equal(B, before)


def test_seven_quiet_days_keep_mean_and_spread():
    days = 7
    contraction = (1 - ANCHOR_PULL) ** days
    for seed in SEEDS:
        rng = np.random.default_rng(seed)
        B, B0, s = random_world(rng, n=5000)
        exposed = rng.random(len(s)) < 0.5
        after = B
        for _ in range(days):
            after = update_beliefs(after, B0, s, np.zeros(N_TOPICS), exposed)
        assert np.abs(after.mean(axis=0) - B.mean(axis=0)).max() < 0.01
        assert (after.std(axis=0) >= contraction * B.std(axis=0)).all()
        assert (after.std(axis=0) >= B0.std(axis=0)).all()
        np.testing.assert_allclose(after - B0, contraction * (B - B0), atol=1e-12)


def test_one_update_moves_no_agent_more_than_step_cap_plus_pull():
    for seed in SEEDS:
        rng = np.random.default_rng(seed)
        B, B0, s = random_world(rng)
        exposed = rng.random(len(s)) < 0.7
        after = update_beliefs(B, B0, s, random_signal(rng, len(s)), exposed)
        bound = STEP_CAP_LOGIT + ANCHOR_PULL * np.abs(B0 - B)
        assert (np.abs(after - B) <= bound + 1e-12).all()


def test_step_cap_binds_for_a_flexible_agent_hit_by_a_huge_signal():
    B0 = np.zeros((2, N_TOPICS))
    signal = np.full(N_TOPICS, 100.0)
    signal[::2] = -100.0
    after = update_beliefs(B0, B0, np.zeros(2), signal, np.array([True, False]))
    np.testing.assert_allclose(np.abs(after[0]), STEP_CAP_LOGIT)
    np.testing.assert_array_equal(after[1], 0.0)


def test_unexposed_agents_only_feel_the_pull():
    for seed in SEEDS:
        rng = np.random.default_rng(seed)
        B, B0, s = random_world(rng)
        exposed = rng.random(len(s)) < 0.5
        after = update_beliefs(B, B0, s, random_signal(rng, len(s)), exposed)
        np.testing.assert_allclose(after[~exposed], (B + ANCHOR_PULL * (B0 - B))[~exposed])


def test_fully_stubborn_agents_never_move_from_the_signal():
    for seed in SEEDS:
        rng = np.random.default_rng(seed)
        B, B0, s = random_world(rng)
        s[rng.random(len(s)) < 0.5] = 1.0
        stubborn = s == 1.0
        after = update_beliefs(B, B0, s, random_signal(rng, len(s)), np.ones(len(s), bool))
        np.testing.assert_allclose(after[stubborn], (B + ANCHOR_PULL * (B0 - B))[stubborn])


def test_nudge_never_exceeds_cap_and_moves_group_mean_toward_target():
    for seed in SEEDS:
        rng = np.random.default_rng(seed)
        B, _, _ = random_world(rng)
        groups = rng.integers(0, 4, len(B))
        targets = {
            (int(g), int(t)): float(rng.uniform(0.02, 0.98))
            for g in np.unique(groups)
            for t in rng.choice(N_TOPICS, 3, replace=False)
        }
        after, records = nudge(B, groups, targets)
        assert len(records) == len(targets)
        for r in records:
            mask = groups == r.group_id
            goal = logit(targets[(r.group_id, r.topic_index)])
            gap_before = abs(goal - B[mask, r.topic_index].mean())
            gap_after = abs(goal - after[mask, r.topic_index].mean())
            assert abs(r.applied) <= NUDGE_CAP_LOGIT
            assert r.wanted == pytest.approx(goal - B[mask, r.topic_index].mean())
            assert gap_after <= gap_before
            if abs(r.wanted) <= NUDGE_CAP_LOGIT:
                assert gap_after == pytest.approx(0, abs=1e-9)
            else:
                assert gap_before - gap_after == pytest.approx(NUDGE_CAP_LOGIT)
            np.testing.assert_allclose(
                after[mask, r.topic_index] - B[mask, r.topic_index], r.applied
            )
        nudged = np.zeros_like(B, bool)
        for g, t in targets:
            nudged[groups == g, t] = True
        np.testing.assert_array_equal(after[~nudged], B[~nudged])


def test_nudge_skips_absent_groups_and_refuses_impossible_shares():
    B = np.zeros((3, N_TOPICS))
    after, records = nudge(B, np.array(["a", "a", "b"]), {("z", 0): 0.6})
    assert records == []
    np.testing.assert_array_equal(after, B)
    for share in (0.0, 1.0, float("nan")):
        with pytest.raises(ValueError):
            nudge(B, np.array(["a", "a", "b"]), {("a", 0): share})


def test_spread_audit_flags_a_collapsed_population():
    B = np.ones((50, N_TOPICS))
    countries = np.array(["KEN"] * 25 + ["IND"] * 25)
    survey = {(c, t): 1.0 for c in ("KEN", "IND") for t in range(N_TOPICS)}
    rows = spread_audit(B, countries, survey)
    assert len(rows) == len(survey)
    assert all(r.sim_sd == 0 and r.ratio == 0 and not r.in_band for r in rows)


def test_spread_audit_passes_matching_spread_and_flags_both_band_edges():
    lo, hi = SPREAD_BAND
    rng = np.random.default_rng(0)
    B = rng.normal(0, 1, (4000, 1))
    sd = float(B.std())
    countries = np.array(["KEN"] * 4000)
    for survey_sd, expected in [
        (sd, True),
        (sd / lo * 1.01, False),
        (sd / hi * 0.99, False),
    ]:
        (row,) = spread_audit(B, countries, {("KEN", 0): survey_sd})
        assert row.ratio == pytest.approx(sd / survey_sd)
        assert row.in_band is expected
    with pytest.raises(ValueError):
        spread_audit(B, countries, {("KEN", 0): 0.0})


def kalman_world(rng, n=300, groups=4):
    B = rng.normal(0, 1, (n, N_TOPICS))
    return B, np.zeros_like(B), np.full_like(B, 0.3), rng.integers(0, groups, n)


def sigmoid(x):
    return float(1 / (1 + np.exp(-x)))


def test_kalman_matches_the_scalar_textbook_update():
    for seed in SEEDS:
        rng = np.random.default_rng(seed)
        B, C, P, g = kalman_world(rng)
        y, obs_sd, walk = float(rng.normal()), 0.4, 0.05
        mean = B[g == 1, 2].mean()
        p = 0.3 + walk**2
        if (y - mean) ** 2 - obs_sd**2 > p:
            continue
        k = p / (p + obs_sd**2)
        B2, C2, P2, recs = kalman_update(B, C, P, g, {(1, 2): (sigmoid(y), obs_sd)}, walk)
        assert B2[g == 1, 2].mean() == pytest.approx(mean + k * (y - mean))
        np.testing.assert_allclose(C2[g == 1, 2], k * (y - mean))
        np.testing.assert_allclose(P2[g == 1, 2], (1 - k) * p)
        assert recs == [(1, 2, pytest.approx(y - mean), pytest.approx(k * (y - mean)))]


def test_kalman_shifts_whole_groups_and_leaves_inputs_alone():
    rng = np.random.default_rng(0)
    B, C, P, g = kalman_world(rng)
    before = B.copy(), C.copy(), P.copy()
    B2, C2, P2, recs = kalman_update(B, C, P, g, {(0, 1): (0.9, 0.2), (9, 1): (0.5, 0.2)})
    for a, b in zip((B, C, P), before, strict=True):
        np.testing.assert_array_equal(a, b)
    moved = B2 - B
    assert np.ptp(moved[g == 0, 1]) < 1e-12 and moved[g == 0, 1][0] != 0
    np.testing.assert_allclose(moved[g == 0, 1], (C2 - C)[g == 0, 1])
    moved[g == 0, 1] = 0.0
    np.testing.assert_array_equal(moved, 0.0)
    assert [r.group_id for r in recs] == [0]


def test_kalman_with_no_polls_only_grows_the_variance():
    rng = np.random.default_rng(1)
    B, C, P, g = kalman_world(rng)
    B2, C2, P2, recs = kalman_update(B, C, P, g, {}, walk_sd=0.1)
    np.testing.assert_array_equal(B2, B)
    np.testing.assert_array_equal(C2, C)
    np.testing.assert_allclose(P2, P + 0.01)
    assert recs == []


def test_kalman_absorbs_a_shock_in_one_poll():
    B = np.zeros((50, N_TOPICS))
    P = np.full_like(B, 0.001)
    B2, _, _, _ = kalman_update(B, B.copy(), P, np.zeros(50), {(0, 0): (sigmoid(1.5), 0.2)}, 0.0)
    assert B2[:, 0].mean() == pytest.approx(1.5, abs=0.05)


def test_kalman_averages_repeated_polls_below_one_polls_noise():
    rng = np.random.default_rng(2)
    groups, obs_sd = 2000, 0.3
    truth = rng.normal(0, 1, groups)
    g = np.arange(groups)
    B = np.zeros((groups, N_TOPICS))
    C, P = np.zeros_like(B), np.ones_like(B)
    for _ in range(30):
        polls = {(i, 0): (sigmoid(truth[i] + rng.normal(0, obs_sd)), obs_sd) for i in range(groups)}
        B, C, P, _ = kalman_update(B, C, P, g, polls, walk_sd=0.0)
    assert np.sqrt(np.mean((B[:, 0] - truth) ** 2)) < 0.8 * obs_sd
