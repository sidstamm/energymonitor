#!/bin/bash

#
# Script to obtain weather from NOAA
# This downloads weather for a specific location and year,
# Then passes it to the parsing script to turn it
# into csv and puts it in the database.
#

if [[ $# -ne 2 ]] ; then
  echo "Usage: $0 /path/to/temps_output.csv /path/to/database.db"
  exit 1
fi

OUTPUTFILE=$1
DATABASE=$2
MYPATH="`dirname $0`"

# Fetch data as usual...
${MYPATH}/getweather.sh ${OUTPUTFILE}

# Clean up the SQLITE DB 
sqlite3 $DATABASE 'DELETE FROM wx;'

# Run the import script
python3 ${MYPATH}/../db-utils/import.py ${OUTPUTFILE} ${DATABASE} envoy

