Greenhouse extensions
---------------------
[![REUSE status](https://api.reuse.software/badge/github.com/cloudoperators/greenhouse-extensions)](https://api.reuse.software/badge/github.com/cloudoperators/greenhouse-extensions)
<a href="https://github.com/cloudoperators/greenhouse-extensions"><img align="left" width="150" height="170" src="https://raw.githubusercontent.com/cloudoperators/.github/main/assets/greenhouse.svg"></a>

Greenhouse is a cloud operations platform designed to streamline and simplify the management of a large-scale, distributed infrastructure.<br>
This repository is used manage these Plugins and curate the Greenhouse Plugin catalog.  
See the [Greenhouse core](https://github.com/cloudoperators/greenhouse) for further details on the platform.

Greenhouse offers a diverse range of plugins that enhance the platform's capabilities.  
These plugins are pre-configured, yet customizable, tools that address various operational needs, reducing the learning curve and enabling teams to seamlessly adopt and configure them.  
The plugin catalog provides a centralized repository of these tools, allowing users to easily explore and select the plugins that best suit their requirements, streamlining their operational tasks.

## Plugin catalog

The [Plugin catalog](./docs/catalog.md) provides an overview of currently available plugins, allowing users to easily explore and select the plugins that best suit their requirements.

## Contributing

Missing a Plugin?  
Contributions are welcome!

The Greenhouse team gladly supports in the development of new Plugins.   
If you need help, please reach out to the team via any of the documented channels.

Please check whether an item from the [Plugin backlog](https://github.com/cloudoperators/greenhouse-extensions/issues?q=is%3Aissue+is%3Aopen+label%3Aplugin) covers your requirements and
consider creating an issue proposing a new Plugin.

### Plugin development

Plugins must offer a consistent experience across the Greenhouse platform.  
This is ensured by below outlined conventions and the provided core and development frameworks.

A Plugin directory must be structured as follows:

```
<Plugin directory>
  ├─ README.md          Human-readable Plugin description
  ├─ plugin.yaml        Plugin configuration via Greenhouse Plugin CRD
  ├─ charts             Optional Helm chart backend 
  └─ ui                 Optional UI frontnd 
```

The *README.md* describes the overall Plugin functionality and highlights configuration options in a human-readable format,
the *plugin.yaml* specifies the front- and backend of a Plugin and its configuration options using the Greenhouse Plugin CRD.
An optional *charts* directory defines the backend for a Plugin as a Helm chart and the *ui* directory the frontend part which can be seen in the Greenhouse UI.

### Local development

Please check [Local development](./docs/local-development.md) for details on how to develop and test Greenhouse extensions locally.

### Walkthrough

See the [walkthrough guide](./docs/extension.md) and the [local development environment](./dev-env/README.md) for details on how to create new Greenhouse extensions.

Various Greenhouse resources are being used within this repository.  
See the [API reference documentation](https://github.com/pages/cloudoperators/greenhouse/docs/apidocs/index.html) for details.

## Support, Feedback, Contributing

This project is open to feature requests/suggestions, bug reports etc. via [GitHub issues](https://github.com/cloudoperators/greenhouse-extensions/issues). Contribution and feedback are encouraged and always welcome. For more information about how to contribute, the project structure, as well as additional contribution information, see our [Contribution Guidelines](CONTRIBUTING.md).

## Code of Conduct

We as members, contributors, and leaders pledge to make participation in our community a harassment-free experience for everyone. By participating in this project, you agree to abide by its [Code of Conduct](https://github.com/cloudoperators/.github/blob/main/CODE_OF_CONDUCT.md) at all times.

## Licensing

Copyright 2024 SAP SE or an SAP affiliate company and Greenhouse contributors. Please see our [LICENSE](LICENSE) for copyright and license information. Detailed information including third-party components and their licensing/copyright information is available [via the REUSE tool](https://api.reuse.software/info/github.com/cloudoperators/greenhouse-extensions).
