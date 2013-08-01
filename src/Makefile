JS_EXTERNS= \
	externs.js
JS= \
	utility.js \
	PointerListener.js \
	Transform.js \
	SlidingList.js \
	Bookshelf.js \
	Carousel.js \
	Train.js \
	FadeTransition.js \
	SimpleItem.js \
	SubstituteImage.js \
	ArrayStream.js \
	JSONStream.js \
	exports.js

BOOKSHELF=..

TARGET_DIR=${BOOKSHELF}/public
TARGET=${TARGET_DIR}/bookshelf.js

COMPILER_DIR=${BOOKSHELF}/tools/closure
COMPILER_JAR=${COMPILER_DIR}/compiler.jar
COMPILER_CLOSURE=java -jar ${BOOKSHELF}/tools/closure/compiler.jar \
	--output_wrapper "/* curtin-library.bitbucket.org/virtual-bookshelf/LICENSE */(function($$){%output%})(jQuery)"
COMPILER_CONCAT=${COMPILER_DIR}/debug-concat.pl
COMPILER_WEBKIT=${COMPILER_DIR}/debug-webkit.pl

COMPILE_FLAGS= \
	--externs="${JS_EXTERNS}" \
	--flagfile=${COMPILER_DIR}/warn-all.flagfile \
	--use_types_for_optimization

.PHONY: all
all: release
	
# Build release version
.PHONY: release
release: COMPILER=${COMPILER_CLOSURE}
release: COMPILE_FLAGS+=--compilation_level ADVANCED_OPTIMIZATIONS
release: ${COMPILER_JAR} ${TARGET}

# For normal debugging, just concatenates files
.PHONY: debug
debug: COMPILER=${COMPILER_CONCAT}
debug: ${COMPILER_JAR} ${TARGET}

# Build with full optimizations, but variables are mangled instead of minified.  Good if something is being unintentionally renamed by Closure.
.PHONY: debug-opt
debug-opt: COMPILER=${COMPILER_CLOSURE}
debug-opt: COMPILE_FLAGS+=--compilation_level ADVANCED_OPTIMIZATIONS --debug --formatting=PRETTY_PRINT
debug-opt: ${COMPILER_JAR} ${TARGET}

# For conveniently debugging in Webkit.  Files are combined into one .js file, but the debugger sees the original files.
.PHONY: debug-webkit
debug-webkit: COMPILER=${COMPILER_WEBKIT}
debug-webkit: ${COMPILER_JAR} ${TARGET}

.PHONY: clean
clean:
	rm -f ${TARGET}

${TARGET_DIR}:
	mkdir ${TARGET_DIR}

${COMPILER_JAR}:
	$(MAKE) -C ${COMPILER_DIR}

${TARGET}: ${JS_EXTERNS} ${JS} ${JS_DEBUG} ${TARGET_DIR}
	${COMPILER} ${COMPILE_FLAGS} --js_output_file $@ ${JS}
