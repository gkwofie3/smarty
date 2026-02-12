try:
    import asteval
    print("asteval OK")
except ImportError:
    print("asteval MISSING")

try:
    import RestrictedPython
    print("RestrictedPython OK")
except ImportError:
    print("RestrictedPython MISSING")
