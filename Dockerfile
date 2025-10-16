# This command is required for poetry to work correctly.
COPY pyproject.toml poetry.lock /app/

# This is a cache layer for poetry
RUN poetry install --no-dev

# Copying project sources
COPY mighty_agent /app/mighty_agent

# Setting up working directory
WORKDIR /app/mighty_agent