"""Debt comparison helper for the workflow test."""


def compare_debt(previous, current):
    """Compare previous and current debt values.

    Args:
        previous: Non-negative integer amount in rubles, or None.
        current: Non-negative integer amount in rubles, or None.

    Returns:
        A dict with ``status`` and ``delta`` keys.

    Raises:
        TypeError: If either value is bool or not an integer/None.
        ValueError: If either integer value is negative.
    """
    _validate_value("previous", previous)
    _validate_value("current", current)

    if previous is None or current is None:
        return {"status": "insufficient_data", "delta": None}

    delta = current - previous
    if delta > 0:
        status = "increased"
    elif delta < 0:
        status = "decreased"
    else:
        status = "unchanged"

    return {"status": status, "delta": delta}


def _validate_value(name, value):
    if value is None:
        return

    if isinstance(value, bool):
        raise TypeError(f"{name} must be a non-negative integer ruble amount or None, not bool")

    if not isinstance(value, int):
        actual_type = type(value).__name__
        raise TypeError(
            f"{name} must be a non-negative integer ruble amount or None, not {actual_type}"
        )

    if value < 0:
        raise ValueError(f"{name} must be a non-negative integer ruble amount")
