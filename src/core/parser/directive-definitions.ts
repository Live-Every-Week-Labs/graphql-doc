export const DIRECTIVE_DEFINITIONS = `
  """
  Groups operations into logical sections for documentation organization.
  """
  directive @docGroup(
    """
    The name of the documentation section
    """
    name: String!

    """
    Display order within documentation (lower numbers first)
    """
    order: Int!

    """
    Optional subsection within the main section
    """
    subsection: String
  ) on FIELD_DEFINITION

  """
  Sets the display priority for ordering operations within a section.
  """
  directive @docPriority(
    """
    Priority level (lower numbers appear first)
    """
    level: Int!
  ) on FIELD_DEFINITION

  """
  Tags for filtering and categorizing operations.
  """
  directive @docTags(
    """
    List of tags for this operation
    """
    tags: [String!]!
  ) on FIELD_DEFINITION

  """
  Exclude this item from generated documentation.
  """
  directive @docIgnore on FIELD_DEFINITION
    | ARGUMENT_DEFINITION
    | INPUT_FIELD_DEFINITION
    | ENUM_VALUE
    | OBJECT
    | INPUT_OBJECT
    | ENUM
    | INTERFACE
    | UNION
    | SCALAR
`;
