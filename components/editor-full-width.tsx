'use client';

import { Plate } from '@udecode/plate-common/react';

import { editorPlugins } from '@/components/editor/plugins/editor-plugins';
import { useCreateEditor } from '@/components/editor/use-create-editor';
import { Editor, EditorContainer } from '@/components/plate-ui/editor';

export default function EditorDefault() {
  const editor = useCreateEditor({
    plugins: [...editorPlugins],
  });

  return (
    <Plate editor={editor}>
      <EditorContainer>
        <Editor variant="fullWidth" placeholder="Type your message here." />
      </EditorContainer>
    </Plate>
  );
}
