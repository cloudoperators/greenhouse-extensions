# Configuration file version
apiVersion: 1

# List of data sources to delete from the database.
deleteDatasources:
#  - name: data-source-name
#    orgId: 1

# List of data sources to insert/update depending on what's
# available in the database.
datasources:
  # <string, required> Sets the name you use to refer to
  # the data source in panels and queries.
  - name: {{ printf "%s-%s" $.Release.Name "prometheus" }}
    # <string, required> Sets the data source type.
    type: prometheus
    # <string, required> Sets the access mode, either
    # proxy or direct (Server or Browser in the UI).
    # Some data sources are incompatible with any setting
    # but proxy (Server).
    access: proxy
    # <int> Sets the organization id. Defaults to orgId 1.
    orgId: 1
    # <string> Sets a custom UID to reference this
    # data source in other parts of the configuration.
    # If not specified, Plutono generates one.
    uid:
    # <string> Sets the data source's URL, including the
    # port.
    url: {{ printf "http://%s-prometheus.%s.svc:9090" $.Release.Name $.Release.Namespace }}
    # <string> Sets the database user, if necessary.
    user:
    # <string> Sets the database name, if necessary.
    database:
    # <bool> Enables basic authorization.
    basicAuth:
    # <string> Sets the basic authorization username.
    basicAuthUser:
    # <bool> Enables credential headers.
    withCredentials:
    # <bool> Toggles whether the data source is pre-selected
    # for new panels. You can set only one default
    # data source per organization.
    isDefault: {{ .Values.kubeMonitoring.prometheus.plutonoDatasource.isDefault }}
    # <map> Fields to convert to JSON and store in jsonData.
    jsonData:
      httpMethod: 'POST'
      # <bool> Enables TLS authentication using a client
      # certificate configured in secureJsonData.
      # tlsAuth: true
      # <bool> Enables TLS authentication using a CA
      # certificate.
      # tlsAuthWithCACert: true
    # <map> Fields to encrypt before storing in jsonData.
    secureJsonData:
      # <string> Defines the CA cert, client cert, and
      # client key for encrypted authentication.
      # tlsCACert: '...'
      # tlsClientCert: '...'
      # tlsClientKey: '...'
      # <string> Sets the database password, if necessary.
      # password:
      # <string> Sets the basic authorization password.
      # basicAuthPassword:
    # <int> Sets the version. Used to compare versions when
    # updating. Ignored when creating a new data source.
    version: 1
    # <bool> Allows users to edit data sources from the
    # Plutono UI.
    editable: false
