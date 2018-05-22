# SQLITE db info #

>    CREATE TABLE envoy (timestamp INTEGER,
>                        date TEXT,
>                        time TEXT,
>                        ProdWnow INTEGER,
>                        ConsWnow INTEGER,
>                        ProdWhToday INTEGER,
>                        ConsWhToday INTEGER,
>                        ProdWh7day INTEGER,
>                        ConsWh7day INTEGER,
>                        ProdWhLife INTEGER,
>                        ConsWhLife INTEGER);

## Importing from CSV ##

Source, destination, tablename.

Use `import.py foo.csv bar.db envoy`
