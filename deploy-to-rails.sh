#!/bin/bash
ember build --environment "production"
rm -rf ../euclip-api/public
mkdir ../euclip-api/public
rsync -av --progress dist/* ../euclip-api/public --exclude audio
