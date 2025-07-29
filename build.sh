#!/bin/bash

# Define the deployment directory and zip file name
DEPLOY_DIR="deploy"
ZIP_FILE="deploy.zip"

# Clean up any previous deployment artifacts
rm -rf $DEPLOY_DIR
rm -f $ZIP_FILE

# Create deployment directory
mkdir $DEPLOY_DIR

# Copy necessary files to the deployment directory
cp -r .next $DEPLOY_DIR/
cp -r public $DEPLOY_DIR/   # Include the public directory
cp package.json $DEPLOY_DIR/

# Zip the deployment directory
zip -r $ZIP_FILE $DEPLOY_DIR

# Cleanup
rm -rf $DEPLOY_DIR

echo "Deployment package created: $ZIP_FILE"