#!/bin/bash

#
# Script to obtain weather from NOAA
# This downloads weather for a specific location and year,
# Then passes it to the parsing script to turn it
# into csv.
#

LOCATION="724373-03868"
YEAR=2018

DL_FILE="${LOCATION}-${YEAR}.gz"

if [[ $# -ne 1 ]] ; then
  echo "Usage: $0 /path/to/temps_output.csv"
  exit 1
fi

OUTPUTFILE=$1

## Heavyweight data -- too much really for this purpose.
#curl -O https://www1.ncdc.noaa.gov/pub/data/noaa/2018/724373-03868-2018.gz 
#gunzip -c 724373-03868-2018.gz | python parseweather.py > /var/www/modem/temps.csv

## "Lite" information (may be enough):
# ftp://ftp.ncdc.noaa.gov/pub/data/noaa/isd-lite/2018/724373-03868-2018.gz
curl -o ${DL_FILE} ftp://ftp.ncdc.noaa.gov/pub/data/noaa/isd-lite/${YEAR}/${DL_FILE}
gunzip -c ${DL_FILE} | python noaa-isdlite2csv.py > ${OUTPUTFILE}

## Probably should eventually use the REST api:
# https://www.ncdc.noaa.gov/cdo-web/webservices/v2

