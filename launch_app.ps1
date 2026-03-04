$env:PATH = "$env:USERPROFILE\.corepack\bin;C:\Program Files\nodejs;" + $env:PATH
$env:COREPACK_HOME = "$env:USERPROFILE\.corepack"
pnpm dev
