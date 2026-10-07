\if :{?db_password}
\else
\echo 'Debes indicar la variable db_password.'
\quit
\endif

SELECT format('CREATE ROLE kdoshsop WITH LOGIN PASSWORD %L CREATEDB', :'db_password')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'kdoshia')
\gexec

SELECT 'CREATE DATABASE kdoshsop OWNER kdoshsop'
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'kdoshia')
\gexec

ALTER DATABASE kdoshia OWNER TO kdoshia;
\connect kdoshia
\i database/schema.sql
