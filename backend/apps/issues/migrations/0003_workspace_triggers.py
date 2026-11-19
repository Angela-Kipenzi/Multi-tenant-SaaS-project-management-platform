from django.db import migrations

FORWARD = """
CREATE OR REPLACE FUNCTION check_issue_workspace_consistency() RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT workspace_id FROM boards_board WHERE id = NEW.board_id) != NEW.workspace_id THEN
        RAISE EXCEPTION 'workspace mismatch on issue %: board not in workspace', NEW.id;
    END IF;
    IF (SELECT workspace_id FROM projects_project WHERE id = NEW.project_id) != NEW.workspace_id THEN
        RAISE EXCEPTION 'workspace mismatch on issue %: project not in workspace', NEW.id;
    END IF;
    IF (SELECT workspace_id FROM boards_column WHERE id = NEW.column_id) != NEW.workspace_id THEN
        RAISE EXCEPTION 'workspace mismatch on issue %: column not in workspace', NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_issue_workspace_check
BEFORE INSERT OR UPDATE ON issues_issue
FOR EACH ROW EXECUTE FUNCTION check_issue_workspace_consistency();
"""

REVERSE = """
DROP TRIGGER IF EXISTS trg_issue_workspace_check ON issues_issue;
DROP FUNCTION IF EXISTS check_issue_workspace_consistency();
"""


class Migration(migrations.Migration):
    dependencies = [("issues", "0002_initial")]
    operations = [migrations.RunSQL(FORWARD, REVERSE)]
