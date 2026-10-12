"""The research page: the experiment registry with its hashes and results, and the papers.

Everything is read from the repository files at request time. Contract: product/research.md.
"""

from fastapi import APIRouter
from pydantic import BaseModel

from rw import experiments, papers

router = APIRouter()

REPO_URL = "https://github.com/SatyamDave/real-world"
BLOB = f"{REPO_URL}/blob/main"


class Primary(BaseModel):
    metric: str
    value: float
    low: float
    high: float
    n: int


class ExperimentResult(BaseModel):
    path: str
    date: str
    command: str
    commit: str
    provider: str
    model: str
    primary: Primary | None
    outcome: str


class Experiment(BaseModel):
    id: str
    title: str
    registered: str
    owner: str
    status: str
    registry_sha256: str
    prereg_sha256: str
    hash_matches: bool
    prereg_url: str
    hypothesis: str
    primary_metric: str
    kill_criterion: str
    results: list[ExperimentResult]


class PaperPdf(BaseModel):
    how: str
    ci: str


class Paper(BaseModel):
    slug: str
    short_title: str
    title: str
    claim: str
    stage: str
    venue: str
    pending: str
    tex_url: str
    status_url: str
    pdf: PaperPdf


class Research(BaseModel):
    experiments: list[Experiment]
    papers: list[Paper]
    repo: str
    commit: str


def _experiment(exp_id: str, row: experiments.Row) -> Experiment:
    actual = experiments.prereg_sha256(exp_id)
    return Experiment(
        id=exp_id,
        title=row["title"],
        registered=row["registered"],
        owner=row["owner"],
        status=row["status"],
        registry_sha256=row["sha256"],
        prereg_sha256=actual,
        hash_matches=actual == row["sha256"],
        prereg_url=f"{BLOB}/experiments/{exp_id}/PREREG.md",
        hypothesis=experiments.prereg_section(exp_id, "Hypothesis"),
        primary_metric=experiments.prereg_section(exp_id, "Primary metric"),
        kill_criterion=experiments.prereg_section(exp_id, "Kill criterion"),
        results=[ExperimentResult.model_validate(r) for r in experiments.results(exp_id)],
    )


def _paper(p: dict[str, str]) -> Paper:
    base = f"{BLOB}/papers/{p['slug']}"
    return Paper(
        **p,
        tex_url=f"{base}/paper.tex",
        status_url=f"{base}/STATUS.md",
        pdf=PaperPdf(
            how=f"cd papers/{p['slug']} && tectonic paper.tex", ci="Papers workflow artifact"
        ),
    )


@router.get(
    "/v1/research",
    summary="The experiment registry with its pre-registration hashes and results, and the papers",
    response_model=Research,
)
def research() -> Research:
    return Research(
        experiments=[_experiment(i, row) for i, row in experiments.registry().items()],
        papers=[_paper(p) for p in papers.papers()],
        repo=REPO_URL,
        commit=experiments.git_commit(),
    )
