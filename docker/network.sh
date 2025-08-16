#!/bin/bash

docker network create --driver=bridge --subnet=172.30.1.0/24 guikipt_network # I could create a redfox_network, 
                                                                             # but since these is from my vps, I want it to be handled
                                                                             # as the same networking of the other containers