import MDEditor from "@uiw/react-md-editor/nohighlight";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";

interface PaperMarkdownEditorProps {
    value: string;
    onChange: (value?: string) => void;
    isSidebar: boolean;
}

export function PaperMarkdownEditor({ value, onChange, isSidebar }: PaperMarkdownEditorProps) {
    return (
        <MDEditor
            value={value}
            onChange={onChange}
            height="100%"
            preview={isSidebar ? "edit" : "live"}
            hideToolbar={isSidebar}
            enableScroll={true}
            visibleDragbar={false}
            className="!border-0 !shadow-none !bg-transparent"
        />
    );
}
