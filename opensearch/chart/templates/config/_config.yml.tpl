_meta:
  type: "config"
  config_version: 2

config:
  dynamic:
    # Set filtered_alias_mode to 'disallow' to forbid more than 2 filtered aliases per index
    # Set filtered_alias_mode to 'warn' to allow more than 2 filtered aliases per index but warns about it (default)
    # Set filtered_alias_mode to 'nowarn' to allow more than 2 filtered aliases per index silently
    #filtered_alias_mode: warn
    #do_not_fail_on_forbidden: false
    #kibana:
    # Kibana multitenancy
    #multitenancy_enabled: true
    #server_username: kibanaserver
    #index: '.kibana'
    http:
      anonymous_auth_enabled: true
      xff:
        enabled: false
        #internalProxies: '192\.168\.0\.10|192\.168\.0\.11' # regex pattern
        #internalProxies: '.*' # trust all internal proxies, regex pattern
        #remoteIpHeader:  'x-forwarded-for'
        ###### see https://docs.oracle.com/javase/7/docs/api/java/util/regex/Pattern.html for regex help
        ###### more information about XFF https://en.wikipedia.org/wiki/X-Forwarded-For
        ###### and here https://tools.ietf.org/html/rfc7239
        ###### and https://tomcat.apache.org/tomcat-8.0-doc/config/valve.html#Remote_IP_Valve
    authc:
      basic_internal_auth_domain:
        description: "Authenticate via HTTP Basic against internal users database"
        http_enabled: true
        transport_enabled: true
        order: 4
        http_authenticator:
          type: basic
          challenge: true
        authentication_backend:
          type: intern
      proxy_auth_domain:
        description: "Authenticate via proxy"
        http_enabled: false
        transport_enabled: false
        order: 3
        http_authenticator:
          type: proxy
          challenge: false
          config:
            user_header: "x-proxy-user"
            roles_header: "x-proxy-roles"
        authentication_backend:
          type: noop
      jwt_auth_domain:
        description: "Authenticate via Json Web Token"
        http_enabled: false
        transport_enabled: false
        order: 0
        http_authenticator:
          type: jwt
          challenge: false
          config:
            signing_key: "base64 encoded HMAC key or public RSA/ECDSA pem key"
            jwt_header: "Authorization"
            jwt_url_parameter: null
            roles_key: null
            subject_key: null
        authentication_backend:
          type: noop
      clientcert_auth_domain:
        description: "Authenticate via SSL client certificates"
        http_enabled: false
        transport_enabled: false
        order: 2
        http_authenticator:
          type: clientcert
          config:
            username_attribute: cn #optional, if omitted DN becomes username
          challenge: false
        authentication_backend:
          type: noop
      ldap:
        description: "Authenticate via LDAP or Active Directory"
        http_enabled: false
        transport_enabled: false
        order: 5
        http_authenticator:
          type: basic
          challenge: false
        authentication_backend:
          # LDAP authentication backend (authenticate users against a LDAP or Active Directory)
          type: ldap
          config:
            # enable ldaps
            enable_ssl: false
            # enable start tls, enable_ssl should be false
            enable_start_tls: false
            # send client certificate
            enable_ssl_client_auth: false
            # verify ldap hostname
            verify_hostnames: true
            hosts:
            - localhost:8389
            bind_dn: null
            password: null
            userbase: 'ou=people,dc=example,dc=com'
            # Filter to search for users (currently in the whole subtree beneath userbase)
            # {0} is substituted with the username
            usersearch: '(sAMAccountName={0})'
            # Use this attribute from the user as username (if not set then DN is used)
            username_attribute: null
    authz:
      roles_from_myldap:
        description: "Authorize via LDAP or Active Directory"
        http_enabled: false
        transport_enabled: false
        authorization_backend:
          # LDAP authorization backend (gather roles from a LDAP or Active Directory, you have to configure the above LDAP authentication backend settings too)
          type: ldap
          config:
            # enable ldaps
            enable_ssl: false
            # enable start tls, enable_ssl should be false
            enable_start_tls: false
            # send client certificate
            enable_ssl_client_auth: false
            # verify ldap hostname
            verify_hostnames: true
            hosts:
            - localhost:8389
            bind_dn: null
            password: null
            rolebase: 'ou=groups,dc=example,dc=com'
            # Filter to search for roles (currently in the whole subtree beneath rolebase)
            # {0} is substituted with the DN of the user
            # {1} is substituted with the username
            # {2} is substituted with an attribute value from user's directory entry, of the authenticated user. Use userroleattribute to specify the name of the attribute
            rolesearch: '(member={0})'
            # Specify the name of the attribute which value should be substituted with {2} above
            userroleattribute: null
            # Roles as an attribute of the user entry
            userrolename: disabled
            #userrolename: memberOf
            # The attribute in a role entry containing the name of that role, Default is "name".
            # Can also be "dn" to use the full DN as rolename.
            rolename: cn
            # Resolve nested roles transitive (roles which are members of other roles and so on ...)
            resolve_nested_roles: true
            userbase: 'ou=people,dc=example,dc=com'
            # Filter to search for users (currently in the whole subtree beneath userbase)
            # {0} is substituted with the username
            usersearch: '(uid={0})'
            # Skip users matching a user name, a wildcard or a regex pattern
            #skip_users:
            #  - 'cn=Michael Jackson,ou*people,o=TEST'
            #  - '/\S*/'
      roles_from_another_ldap:
        description: "Authorize via another Active Directory"
        http_enabled: false
        transport_enabled: false
        authorization_backend:
          type: ldap
          #config goes here ...
  #    auth_failure_listeners:
  #      ip_rate_limiting:
  #        type: ip
  #        allowed_tries: 10
  #        time_window_seconds: 3600
  #        block_expiry_seconds: 600
  #        max_blocked_clients: 100000
  #        max_tracked_clients: 100000
  #      internal_authentication_backend_limiting:
  #        type: username
  #        authentication_backend: intern
  #        allowed_tries: 10
  #        time_window_seconds: 3600
  #        block_expiry_seconds: 600
  #        max_blocked_clients: 100000
  #        max_tracked_clients: 100000
