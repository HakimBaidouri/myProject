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
          top: 40,
          right: 75,
          bottom: 0,
          left: 75
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
        },
        pageHeight: 1122.52,
        pageWidth: 816,
        autoPageBreak: true
      }),
      PageNode,
      HeaderFooterNode,
      BodyNode,
    ]
  },
}) 