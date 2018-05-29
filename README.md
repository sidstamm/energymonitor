# energymonitor

Monitors energy usage (and production) and displays reports through a web site.

## probes/ directory

Here are scripts for fetching data from devices, NOAA, etc.

## www/ directory

This contains the web site.  Once you've put this somewhere you will need:

* d3 -- put it in the www/ dir when you've grabbed it.  You can get it from 
  the [d3 github](https://github.com/d3/d3/releases/latest)

* data/temps.csv -- you can get this by running the `getweather.sh` probe (or
  use the provided sample).

* data/energy.csv -- you can get this by running the `queryenvoy.py` probe (or
  use the provided sample).

* db/energymonitor.db -- this is the database used by the web app (since the
  .csv files are really too big to be useful).  To build this, use
  dbutils/makedb.py to create it, then use dbutils/import.py to import the
  temps and energy.csv files.  Once you've set up the db, you can just use the 
  db probes to keep it up to date.)

When you have it installed and running, the web page looks like this:
![screenshot](https://github.com/sidstamm/energymonitor/blob/master/energymonitor-screenshot.png)
