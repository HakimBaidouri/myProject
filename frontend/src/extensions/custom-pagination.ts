import { Extension } from '@tiptap/core'
import PaginationExtension, { PageNode, HeaderFooterNode, BodyNode } from 'tiptap-extension-pagination'

export const CustomPaginationExtension = Extension.create({
  name: 'customPagination',

  addExtensions() {
    return [
      PaginationExtension.configure({
        defaultPaperSize: "A4",
        defaultPaperColour: "#fff",
        useDeviceThemeForPaperColour: false,
        defaultPaperOrientation: "portrait",
        defaultMarginConfig: {
          top: 10,
          right: 10,
          bottom: 10,
          left: 10
        },
        defaultPageBorders: {
          top: 1,
          right: 1,
          bottom: 1,
          left: 1
        },
        pageAmendmentOptions: {
          enableHeader: false,
          enableFooter: false
        }
      }),
      PageNode,
      HeaderFooterNode,
      BodyNode,
    ]
  },
}) 