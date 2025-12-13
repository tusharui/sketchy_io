hooks-install :
	pre-commit install && \
	pre-commit run --all-files

install :
	pre-commit install && \
	cd web && bun i && \
	cd ../server && bun i

check :
	cd web && bun check && \
	cd ../server && bun check

setup :
	$(MAKE) hooks-install && \
	$(MAKE) install
