# Coding standards

## Version control

We use git repositories for all version control. We aim for a high
standard of git commit hygiene on all shared branches, both in how
changes are grouped into each commit, and in how the commit message is
written. (This only applies to shared branches such as PR branches or
upstream/master or other stable branches; obviously, every developer is
free to do whatever they want with private changes in their personal
repositories.)

## Git commit grouping

We aim for a high standard in terms of how changes are grouped together
into commits. As a brief summary, the following golden rules apply
almost 100% of the time:

- A commit should never break the tests or other CI

  - For example, it should not rely on another commit later in the
    same PR to fix a bug it introduces.

- A commit should be as small as possible, but no smaller.

  - For example, when adding a new feature, the new tests for that
    feature should be in the same commit. Ideally the
    documentation should too, at least if the documentation
    changes are small.

- A single commit should never mix unrelated changes.

  - For example, refactorings should never be mixed with bugfixes.

The following resources offer useful advice on this topic:

- [GitCommitMessages - OpenStack](https://wiki.openstack.org/wiki/GitCommitMessages#Structural_split_of_changes)
  (short but good; gives examples of what to avoid)
- [Atomic Commits in the Command Line with Git](https://seesparkbox.com/foundry/atomic_commits_with_git)

## Git commit messages

We aim for high quality commit messages which always have both a title
and a body, and **always clearly explain the "why"**, i.e. the context
and motivation for the change, not just the **"how"**.

We adopt the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) standard as a
taxonomy for different types of commits, and to track compatibility
according to [SemVer](https://semver.org/) principles.

The [Perfecting the Patch](https://www.youtube.com/watch?v=pU-VasVPNAs) YouTube video is
highly recommended, as are the following resources:

- [A guide on commit messages - DEV Community](https://dev.to/yvonnickfrin/a-guide-on-commit-messages-d8n)
- [How to Write a Git Commit Message](https://chris.beams.io/posts/git-commit/)
- [GitCommitMessages - OpenStack](https://wiki.openstack.org/wiki/GitCommitMessages)
- [Submitting patches: the essential guide to getting your code into the kernel](https://www.kernel.org/doc/Documentation/SubmittingPatches)
- [A Note About Git Commit Messages](https://tbaggery.com/2008/04/19/a-note-about-git-commit-messages.html)
- [The Art of the Commit -- A List Apart](https://alistapart.com/article/the-art-of-the-commit)
- [7 principles for contributing patches to software projects](http://blog.adamspiers.org/2012/11/10/7-principles-for-contributing-patches-to-software-projects/)

## Pull Request - code review

- PRs SHOULD be submitted for each change, in order to ensure that all
  changes are checked by the CI pipeline.

- For easy review, PRs SHOULD contain:

  - a clear title - in sync with the Liner ticket title

  - a description clearly explaining the **"why"**, i.e. the context. If the issue tracker issue is linked from the PR it's not necessary to duplicate the description, but at least a high level should be given. In addition PR description should document **how** this has been solved, and why this approach was taken.

  - the `CO2-123` identifier for any related issue in the
    [linear.app](https://linear.app) issue tracker if applicable

  - a small number of commits (e.g. < 5)

- Reviews should be requested from at least one other developer.

- Feedback should generally be addressed by rewriting PR branch
  history to adhere to the git commit hygiene best practices
  documented above. For example, see:

  - [Why and how to correctly amend GitHub pull > requests](https://blog.adamspiers.org/2015/03/24/why-and-how-to-correctly-amend-github-pull-requests/)

- Criteria for merging PRs:

  - All CI should be passing, unless there are exceptional
    circumstances justifying ignoring failures (e.g. an emergency
    hotfix to production code)

  - Reviews have been received, and feedback resolved to everyone's
    reasonable satisfaction.

## Ignoring noisy git history

It is also recommended to configure `git blame` to ignore commits
which were purely for fixing linting issues. You can do this by using
the provided `.gitblameignore` file:

    git config blame.ignoreRevsFile .gitblameignore
