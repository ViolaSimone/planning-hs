# Marks "routers" as a Python package. No shared code lives here on
# purpose: each router is self-contained and only depends on crud.py,
# models.py, schemas.py, config.py and (where relevant) alert_engine.py /
# notifications.py / scheduler.py.
