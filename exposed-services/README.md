---
title: Service exposure test
---

This Plugin is just providing a simple exposed service for manual testing.

By adding the following label or annotation to a service it will become accessible from the central greenhouse system via a service proxy:

**Label (legacy, transitioning to annotation):**
```greenhouse.sap/expose: "true"```

**Annotation:**
```greenhouse.sap/expose: "true"```

During the transition period, both label and annotation are supported.

This plugin create an nginx deployment with an exposed service for testing.

# Configuration

## Specific port

By default expose would always use the first port. If you need another port, you've got to specify it by name:

**Label (legacy, transitioning to annotation):**
```greenhouse.sap/exposeNamedPort: YOURPORTNAME```

**Annotation:**
```greenhouse.sap/exposed-named-port: YOURPORTNAME```

During the transition period, both label and annotation are supported.
