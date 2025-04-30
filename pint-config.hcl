parser {
  relaxed = [ ".*.yaml", ".*.alerts", ".*.tpl" ]
}

rule {
  match {
    path = "(.yaml|.yml)"
    command = "lint"
  }
}

rule {
  match {
    path = "(.alerts)"
    command = "lint"
  }
}

rule {
  match {
    path = "(.tpl)"
    command = "lint"
  }
}