#!/bin/bash

# Create backend structure
mkdir -p backend/{src/{config,controllers,models,routes,middlewares,services,utils,validators},tests,uploads}

# Create frontend structure
mkdir -p frontend/{src/{pages,components,services,hooks,context,utils,assets},public}

# Create detailed backend folders
mkdir -p backend/src/config
mkdir -p backend/src/controllers
mkdir -p backend/src/models
mkdir -p backend/src/routes
mkdir -p backend/src/middlewares
mkdir -p backend/src/services
mkdir -p backend/src/utils
mkdir -p backend/src/validators

# Create detailed frontend folders
mkdir -p frontend/src/pages/{auth,dashboard,projects,tasks,profile}
mkdir -p frontend/src/components/{common,layout,projects,tasks}
mkdir -p frontend/src/services
mkdir -p frontend/src/hooks
mkdir -p frontend/src/context
mkdir -p frontend/src/utils
mkdir -p frontend/src/assets/{images,styles}

echo "✅ Folder structure created!"

