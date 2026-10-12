import pytest

from rw.sources import SourceNotCleared, require


@pytest.mark.parametrize("source_id", ["fixture_sample", "fixture_news", "gdelt", "natural_earth"])
def test_fixture_and_cleared_sources_are_allowed(source_id):
    assert require(source_id)["source_id"] == source_id


@pytest.mark.parametrize(
    "source_id", ["glopop_s", "wvs", "polymarket", "ipums_international", "gadm"]
)
def test_unknown_and_refused_sources_raise(source_id):
    with pytest.raises(SourceNotCleared):
        require(source_id)


def test_unlisted_source_raises():
    with pytest.raises(SourceNotCleared):
        require("not_a_source")
