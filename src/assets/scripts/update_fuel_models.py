# Usage
#     python3 update_fuel_models.py -o <collection_owner> -k <access key>
#
# Description
#     This script will modify usage of 'fuel.ignitionrobotics.org' to 'fuel.gazebosim.org'.
#
import sys,json,requests
import getopt
import os
import zipfile
import shlex

def is_tool(name):
  """Check whether `name` is on PATH and marked as executable."""
  from shutil import which
  return which(name) is not None

if is_tool('ign'):
    cmd_tool = 'ign'
elif is_tool('gz'):
    cmd_tool = 'gz'
else:
    print('Unable to find the ign or gz command line tools.')
    quit()

if sys.version_info[0] < 3:
    raise Exception("Python 3 or greater is required. Try running `python3 update_fuel_models.py`")

collection_name = ''
owner_name = ''
key = ''

# Read options
optlist, args = getopt.getopt(sys.argv[1:], 'o:k:')

for o, v in optlist:
    if o == "-o":
        owner_name = v.replace(" ", "%20")
    if o == "-k":
        key = v

if not owner_name:
    print('Error: missing `-o <owner_name>` option')
    quit()


if not key:
    print('Error: missing `-k <key>` option')
    quit()

print("Downloading models from the {} owner.".format(owner_name))

page = 1
count = 0

# The Fuel server URL.
base_url ='https://fuel.gazebosim.org/'

# Fuel server version.
fuel_version = '1.0'

# Path to get the models in the collection
next_url = '/{}/models?page={}&per_page=100'.format(owner_name,page)

# Path to download a single model in the collection
download_url = base_url + fuel_version + '/{}/models/'.format(owner_name)

# Iterate over the pages
while True:
    page_count = 0
    url = base_url + fuel_version + next_url

    # Get the contents of the current page.
    r = requests.get(url)

    if not r or not r.text:
        break

    # Convert to JSON
    models = json.loads(r.text)

    # Compute the next page's URL
 
    # Download each model 
    for model in models:
        count+=1
        page_count += 1
        model_name = model['name']
        print ('Downloading page[%d][%d] (%d) %s' % (page,page_count, count, model_name))
        download = requests.get(download_url+model_name+'.zip', stream=True)
        with open(model_name+'.zip', 'wb') as fd:
            for chunk in download.iter_content(chunk_size=1024*1024):
                fd.write(chunk)
        with zipfile.ZipFile(model_name+'.zip', 'r') as zip_ref:
            zip_ref.extractall(model_name)

        print ('    Patching model');
        # Change working directory
        os.chdir(model_name)
        os.system("find -type f -execdir sed -i 's/fuel\.ignitionrobotics/fuel\.gazebosim/g' {} \;")
        os.system("find -type f -execdir sed -i 's/app\.ignitionrobotics/app\.gazebosim/g' {} \;")
        metadata = "metadata.pbtxt"
        modelconfig = "model.config"

        # Add metadata
        if not os.path.exists(metadata):
            cmd = cmd_tool + ' fuel meta --config2pbtxt {} > {}'.format(modelconfig, metadata)
            os.system(cmd);

        os.chdir("..")

        print('    Uploading model.')
        cmd = "ign fuel upload -m {} -u https://fuel.gazebosim.org -o {} --header 'Private-token: {}'".format(shlex.quote(model_name), owner_name, key)
        print (cmd)
        #os.system(cmd)
        os.remove(model_name+'.zip')
    page = page + 1
    next_url = '/{}/models?page={}&per_page=100'.format(owner_name,page)
 
print('Done.')
