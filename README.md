# energymonitor

Monitors energy usage (and production) and displays reports through a web site.

## www/ directory

This contains the web site.  Once you've put this somewhere you will need:

* d3 -- put it in the www/ dir when you've grabbed it.  You can get it from the [d3 github](https://github.com/d3/d3/releases/latest)
* data/temps.csv -- you can get this by running the `getweather.sh` probe (or use the provided sample).
* data/energy.csv -- you can get this by running the `queryenvoy.py` probe (or use the provided sample).
