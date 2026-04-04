"""Quick verification that the FastAPI app loads correctly."""
from main import app

print("FastAPI app loaded successfully!")
print(f"Title: {app.title}")
print(f"Version: {app.version}")
print(f"Total routes: {len(app.routes)}")
print("\nRegistered routes:")
for route in app.routes:
    methods = getattr(route, "methods", None)
    if methods:
        for m in methods:
            print(f"  {m:6s} {route.path}")
    else:
        print(f"  MOUNT  {route.path}")

print("\n✅ All routers loaded. Server ready.")
