
// .storybook/preview.js
import { addDecorator } from "@storybook/react"
// import theme from "./codeTheme"
import DocViewer from "../libs/doc-viewer"
import "./reset.css"
import "@hi-ui/hiui/es/base-css"
import React, { useRef, useState } from "react"
// import { Meta, ArgsTable, Source, Story, Canvas } from "@storybook/addon-docs/blocks"
// import { Title, Subtitle, Description, Primary, ArgsTable, Stories, PRIMARY_STORY } from "@storybook/addon-docs/blocks"
// import { LiveProvider, LiveEditor, LiveError, LivePreview } from "react-live"

// import Popper from "../packages/ui/popper/src/index.js"
// import Alert from "../packages/ui/alert/es/index.js"
// import Select from "../packages/ui/select/src/index.js"
// import Loading from "../packages/ui/loading/src"
// import Avatar from "../packages/ui/avatar/src"
// import Checkbox from "../packages/ui/checkbox/src"
// import EmptyState from "../packages/ui/empty-state/src"

const importRegx = /import\s+([\w*{}\n, ])+.*;?/gm

function addSbCodeEditro(cb, props) {
  const { argTypes, args } = props
  const Component = props.parameters.component
  const { parameters = {}, globals } = props
  const {
    storySource = {},
    args: { desc = "" }
  } = parameters
  const code = storySource.source
  console.log("props", props)
  return (
    <DocViewer
      desc={desc}
      code={code}
      // scope={{ Popper, Alert, Select, useRef, useState, globals, Avatar, Loading, Checkbox, EmptyState }}
      prefix={"alert-autoClose"}
    />
  )
}

addDecorator(addSbCodeEditro)

export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
  layout: "centered",
  options: {
    storySort: {
      order: ["HiUI 简介", "Alert", "页面", "数据录入"],
      locales: "en-US"
    }
  }
}

export const globalTypes = {
  theme: {
    name: "Theme",
    description: "Global theme for components",
    defaultValue: "light",
    toolbar: {
      icon: "circlehollow",
      // array of plain string values or MenuItem shape (see below)
      items: ["light", "dark"]
    }
  },
  locale: {
    name: "Locale",
    description: "Internationalization locale",
    defaultValue: "en",
    toolbar: {
      icon: "globe",
      items: [
        { value: "en", right: "🇺🇸", title: "English" },
        { value: "fr", right: "🇫🇷", title: "Français" },
        { value: "es", right: "🇪🇸", title: "Español" },
        { value: "zh", right: "🇨🇳", title: "中文" },
        { value: "kr", right: "🇰🇷", title: "한국어" }
      ]
    }
  }
}