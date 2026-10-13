import os

# Tests never reach a model provider: every run answers from FakeLLM, whatever the shell holds.
for key in ("TYPESAFE_API_KEY", "OPENROUTER_API_KEY", "RW_TEXT_BASE_URL"):
    os.environ.pop(key, None)
