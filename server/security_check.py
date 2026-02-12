from asteval import Interpreter
import sys

# Test default symbols
aeval = Interpreter()
symbols = [k for k in aeval.symtable.keys() if not k.startswith('_')]
print("DEFAULT SYMBOLS:")
print(", ".join(sorted(symbols)))

# Test if print works by default
code = 'print("PRINT_TEST_SUCCESS")'
print("\nTESTING PRINT:")
aeval(code)

# Test with no_print=True
print("\nTESTING NO_PRINT=TRUE:")
aeval_noprint = Interpreter(no_print=True)
aeval_noprint(code)
print("NoPrint Errors:", aeval_noprint.error)

# Test with explicit removal
print("\nTESTING EXPLICIT REMOVAL:")
aeval_restricted = Interpreter()
if 'print' in aeval_restricted.symtable:
    del aeval_restricted.symtable['print']
aeval_restricted(code)
if aeval_restricted.error:
    print("Caught expected error:", aeval_restricted.error[0].msg)
