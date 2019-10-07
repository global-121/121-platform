Shared Git Hooks
================

You can use these scripts as [git-hooks](https://git-scm.com/docs/githooks) by:

- Creating a symbolic link to them individually from your `.git/hooks/`-folder, via:

      ln -s "tools/git-hooks/pre-commit" ".git/hooks/pre-commit"

- Or to use them all; Setting your git config via:

      git config --local core.hooksPath tools/git-hooks/

