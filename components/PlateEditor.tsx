'use client'

import React from 'react'
import { createPlateUI, Plate, PlateContent, PlateProvider, createPlugins } from '@udecode/plate-common'
import { createParagraphPlugin } from '@udecode/plate-paragraph'
import { createHeadingPlugin } from '@udecode/plate-heading'
import { createBoldPlugin, createItalicPlugin, createUnderlinePlugin } from '@udecode/plate-basic-marks'
import { createBlockquotePlugin } from '@udecode/plate-block-quote'
import { createCodeBlockPlugin } from '@udecode/plate-code-block'
import { createListPlugin } from '@udecode/plate-list'

const plugins = createPlugins([
  createParagraphPlugin(),
  createHeadingPlugin(),
  createBoldPlugin(),
  createItalicPlugin(),
  createUnderlinePlugin(),
  createBlockquotePlugin(),
  createCodeBlockPlugin(),
  createListPlugin(),
], {
  components: createPlateUI(),
})

export function PlateEditor() {
  const initialValue = [
    {
      type: 'p',
      children: [{ text: 'This is editable rich text, much better than a <textarea>!' }],
    },
    {
      type: 'p',
      children: [
        { text: "Since it's rich text, you can do things like turn a selection of text " },
        { text: 'bold', bold: true },
        { text: ', or add a semantically rendered block quote in the middle of the page, like this:' },
      ],
    },
    {
      type: 'blockquote',
      children: [{ text: 'A wise quote.' }],
    },
    {
      type: 'p',
      children: [{ text: 'Try it out for yourself!' }],
    },
  ]

  return (
    <PlateProvider plugins={plugins}>
      <Plate initialValue={initialValue}>
        <PlateContent className="p-4 border rounded-md min-h-[200px]" />
      </Plate>
    </PlateProvider>
  )
}