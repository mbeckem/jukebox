# Build settings
DEBUG ?= 0
RELEASE := $(if $(filter 1,$(DEBUG)),0,1)

# Important directories
BUILD_ROOT ?= build
TMP_DIR := $(BUILD_ROOT)/tmp
DIST_DIR := $(BUILD_ROOT)/dist

# Python application code.
APP_SOURCES := main.py $(shell find server -type f \( -name "*.py" -o -name "*.tmpl" \))
APP_TARGETS := $(addprefix $(DIST_DIR)/,$(APP_SOURCES))

# Assets
ASSETS_SOURCES := $(shell find assets -type f)
ASSETS_TARGETS := $(addprefix $(DIST_DIR)/,$(ASSETS_SOURCES))

# Webapp
WEBAPP_SOURCES := $(shell find webapp -type f \( -name "*.js" -o -name "*.jsx" \) )
WEBAPP_DEPENDENCY_FILE := webapp/dependencies.txt
WEBAPP_DEPENDENCIES := $(shell cat $(WEBAPP_DEPENDENCY_FILE))
WEBAPP_EXTENSION := $(if $(filter 1,$(DEBUG)),js,ugly.js)
WEBAPP_TARGETS := $(DIST_DIR)/assets/js/main.js $(DIST_DIR)/assets/js/deps.js

CSS_SOURCES := $(shell find webapp -type f -name "*.scss")
CSS_TARGETS := $(DIST_DIR)/assets/css/main.css
ifeq ($(DEBUG),1)
    CSS_TARGETS += $(DIST_DIR)/assets/css/main.css.map
endif

# Utilities
NPM_BIN := $(shell npm bin)
NODE_ENV := $(if $(filter 1,$(RELEASE)),production,development)
define NODE_CMD
	NODE_ENV=$(NODE_ENV) "$(NPM_BIN)/$(1)"
endef

all: $(APP_TARGETS) \
    $(ASSETS_TARGETS) $(WEBAPP_TARGETS) $(CSS_TARGETS) \
    $(DIST_DIR)/requirements.txt

debug:
	@$(MAKE) DEBUG=1 --no-print-directory all

deps:
	@echo "Installing dependencies"
	@npm install

watch: debug
	@+ BUILD_DIR="$(BUILD_ROOT)" ./scripts/watch

lint:
	@mkdir -p "$(TMP_DIR)"
	@$(call NODE_CMD,eslint) \
		--cache --cache-location $(TMP_DIR)/eslint-cache \
		--color $(WEBAPP_SOURCES)

clean:
	rm -rf "$(BUILD_ROOT)/"*

# Uglify javascript files for release builds.
$(TMP_DIR)/%.ugly.js: $(TMP_DIR)/%.js
	@echo "Minifying javascript file $@"
	@mkdir -p "$(@D)"
	@$(call NODE_CMD,uglifyjs) "$<" -c warnings=false -m -o "$@"

# Webapp source files are processed by browserify (with babel)
# and are combined into main.js.
$(TMP_DIR)/main.js: $(WEBAPP_SOURCES)
	@echo "Compiling javascript file $@"
	@mkdir -p "$(@D)"
	@$(eval ext_deps := $(WEBAPP_DEPENDENCIES:%=-x %))

	@$(eval browserify_flags := )
	@$(eval babelify_flags := )

ifeq ($(DEBUG), 1)
	@$(eval browserify_flags += -d)
	@$(eval babelify_flags := --sourceMaps "both")
endif
	@$(eval browserify_flags += -t [ babelify $(babelify_flags) ])
ifeq ($(RELEASE), 1)
	@$(eval browserify_flags += -t stripify)
endif
	@$(call NODE_CMD,browserify) $(browserify_flags) $(ext_deps) webapp/main.js -o "$@"

# Javascript libraries are merged into a single deps.js file.
$(TMP_DIR)/deps.js: $(WEBAPP_DEPENDENCY_FILE)
	@echo "Compiling javascript dependencies $@"
	@mkdir -p "$(@D)"
	@$(eval ext_deps := $(WEBAPP_DEPENDENCIES:%=-r %))
	@$(call NODE_CMD,browserify) $(ext_deps) -o "$@"

$(TMP_DIR)/main.css: $(CSS_SOURCES)
	@echo "Compiling stylesheet $@"
	@mkdir -p "$(@D)"
	@$(eval src_map := $(if $(filter 1,$(RELEASE)),none,inline))
	@sass --scss --sourcemap=$(src_map) webapp/scss/main.scss "$@"

$(TMP_DIR)/main.css.map: $(TMP_DIR)/main.css

# Copy targets will be copied from their single dependency into the dist directory.
COPY_TARGETS := $(APP_TARGETS) \
    $(ASSETS_TARGETS) $(WEBAPP_TARGETS) $(CSS_TARGETS) \
    $(DIST_DIR)/requirements.txt

$(COPY_TARGETS):
	@echo Copying $< to $@
	@mkdir -p "$(@D)"
	@cp -f "$<" "$@"

# Dependencies of COPY_TARGETS
$(APP_TARGETS) $(ASSETS_TARGETS): $(DIST_DIR)/%: %
$(WEBAPP_TARGETS): $(DIST_DIR)/assets/js/%.js: $(TMP_DIR)/%.$(WEBAPP_EXTENSION)
$(CSS_TARGETS): $(DIST_DIR)/assets/css/%: $(TMP_DIR)/%
$(DIST_DIR)/requirements.txt: requirements.txt

.PHONY: all debug deps watch lint clean always-remake
