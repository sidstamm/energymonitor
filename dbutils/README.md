# SQLITE db utility info #

This directory has a bunch of utility scripts for operating on the sqlite3 database.

You should keep the database (once made) in `www/db/energymonitor.db`.


## Schema ##

See makedb.py for schema


## Importing from CSV ##

Syntax: Source, destination, tablename.

* Use `import.py foo.csv bar.db envoy`
* Use `import.py foo.csv bar.db wx`

Warning: these do not overwrite or deduplicate; you should erase old data
before doing another import.
