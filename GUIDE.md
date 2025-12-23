# Project Initialization

When starting a new project, always use the "/init" command. This command creates a "Pixel.md" document containing your project documentation for easy reference.

# Working Effectively

After initializing your project, always ask Pixel to explain the project thoroughly. Request details about each component, their functionalities, and how they interconnect with other parts of your project.

If you're planning a major change, such as large-scale refactoring or adding complex new functionality, always instruct Pixel to outline a plan before implementing any changes. Encourage deeper thinking by using phrases such as:

- Think hard
- Think deep
- Think longer

After reviewing Pixel's proposed plan, if you agree, proceed directly with the changes. If not, request revisions to the plan.

For smaller changes, such as simple, single-file updates or straightforward features, clearly specify the exact file you want to modify. For example:

- Pixel, can you increase the size of the chat input in the file "user/page.tsx"?
- Pixel, can you add error handling to "data_processing.py"?
- Pixel, please refactor the `calculate_totals` function in "invoice.py"

# Other Best Practices

- Regularly use the `/compact` command during development. This helps Pixel remain efficient and reduces the risk of confusion in long-term projects.
- Always be explicit about which files you intend to change and clearly state their relationships to other components.
- Frequently run tests. Pixel excels at validating new functionality through thorough testing, ensuring reliability and accuracy.
- Periodically ask Pixel to review the entire project, assessing logic consistency and identifying any redundant or inefficient code.