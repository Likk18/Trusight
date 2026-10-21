"""TruSight backend application package."""
import os

# Prevent transformers from probing or importing TensorFlow
os.environ["USE_TF"] = "0"
os.environ["USE_TORCH"] = "1"

# Suppress strict Protobuf gencode/runtime mismatch checks (e.g. gencode 6.x vs runtime 5.x)
try:
    import google.protobuf.runtime_version as _pb_runtime
    _pb_runtime.ValidateProtobufRuntimeVersion = lambda *args, **kwargs: None
    _pb_runtime._ReportVersionError = lambda *args, **kwargs: None
except Exception:
    pass
