---
title: Service exposure test
---

This Plugin is just providing a simple exposed service for manual testing.

By adding the following label to a service it will become accessible from the central greenhouse system via a service proxy:

```greenhouse.sap/expose: "true"```

This plugin create an nginx deployment with an exposed service for testing.

# Configuration

## Specific port

By default expose would always use the first port. If you need another port, you've got to specify it by name:

```greenhouse.sap/exposeNamedPort: YOURPORTNAME```
