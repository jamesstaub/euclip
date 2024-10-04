#!/bin/bash
# This script assumes the repo euclip-api is in the same 
# parent directory as this ember repo

ember build --environment "production"
rm -rf ../euclip-api/public
mkdir ../euclip-api/public
rsync -av --progress dist/* ../euclip-api/public --exclude audio/drum-machines
