import {
  h,
  ref,
  computed,
  defineComponent,
  PropType,
  mergeProps,
  HTMLAttributes
} from 'vue'
import { getMargin } from 'seemly'
import {
  InfoIcon,
  SuccessIcon,
  WarningIcon,
  ErrorIcon
} from '../../_internal/icons'
import { NFadeInExpandTransition, NBaseClose, NBaseIcon } from '../../_internal'
import useRtl from '../../_mixins/use-rtl'
import { useConfig, useTheme, useThemeClass } from '../../_mixins'
import type { ThemeProps } from '../../_mixins'
import { warn, createKey, resolveSlot, resolveWrappedSlot } from '../../_utils'
import type { ExtractPublicPropTypes } from '../../_utils'
import { alertLight } from '../styles'
import type { AlertTheme } from '../styles'
import style from './styles/index.cssr'

const alertProps = {
  ...(useTheme.props as ThemeProps<AlertTheme>),
  title: {
    type: String,
    default: undefined
  },
  showIcon: {
    type: Boolean,
    default: true
  },
  type: {
    type: String as PropType<
    'info' | 'warning' | 'error' | 'success' | 'default'
    >,
    default: 'default'
  },
  closable: {
    type: Boolean,
    default: false
  },
  onClose: Function,
  onAfterLeave: {
    type: Function,
    default: undefined
  },
  onAfterHide: {
    type: Function,
    validator: () => {
      if (__DEV__) {
        warn(
          'alert',
          '`on-after-hide` is deprecated, please use `on-after-leave` instead.'
        )
      }
      return true
    },
    default: undefined
  }
}

export type AlertProps = ExtractPublicPropTypes<typeof alertProps>

export default defineComponent({
  name: 'Alert',
  inheritAttrs: false,
  props: alertProps,
  setup (props) {
    const { mergedClsPrefixRef, inlineThemeDisabled, mergedRtlRef } =
      useConfig(props)
    const themeRef = useTheme(
      'Alert',
      '-alert',
      style,
      alertLight,
      props,
      mergedClsPrefixRef
    )
    const rtlEnabledRef = useRtl('Alert', mergedRtlRef, mergedClsPrefixRef)
    const cssVarsRef = computed(() => {
      const {
        common: { cubicBezierEaseInOut },
        self
      } = themeRef.value
      const {
        fontSize,
        borderRadius,
        titleFontWeight,
        lineHeight,
        iconSize,
        iconMargin,
        iconMarginRtl,
        closeSize,
        closeMargin,
        closeMarginRtl,
        padding
      } = self
      const { type } = props
      const { left, right } = getMargin(iconMargin)
      return {
        '--n-bezier': cubicBezierEaseInOut,
        '--n-color': self[createKey('color', type)],
        '--n-close-color': self[createKey('closeColor', type)],
        '--n-close-color-hover': self[createKey('closeColorHover', type)],
        '--n-close-color-pressed': self[createKey('closeColorPressed', type)],
        '--n-icon-color': self[createKey('iconColor', type)],
        '--n-border': self[createKey('border', type)],
        '--n-title-text-color': self[createKey('titleTextColor', type)],
        '--n-content-text-color': self[createKey('contentTextColor', type)],
        '--n-line-height': lineHeight,
        '--n-border-radius': borderRadius,
        '--n-font-size': fontSize,
        '--n-title-font-weight': titleFontWeight,
        '--n-icon-size': iconSize,
        '--n-icon-margin': iconMargin,
        '--n-icon-margin-rtl': iconMarginRtl,
        '--n-close-size': closeSize,
        '--n-close-margin': closeMargin,
        '--n-close-margin-rtl': closeMarginRtl,
        '--n-padding': padding,
        '--n-icon-margin-left': left,
        '--n-icon-margin-right': right
      }
    })
    const themeClassHandle = inlineThemeDisabled
      ? useThemeClass(
        'alert',
        computed(() => {
          return props.type[0]
        }),
        cssVarsRef,
        props
      )
      : undefined
    const visibleRef = ref(true)
    const doAfterLeave = (): void => {
      const {
        onAfterLeave,
        onAfterHide // deprecated
      } = props
      if (onAfterLeave) onAfterLeave()
      if (onAfterHide) onAfterHide()
    }
    const handleCloseClick = (): void => {
      void Promise.resolve(props.onClose?.()).then((result) => {
        if (result === false) return
        visibleRef.value = false
      })
    }
    const handleAfterLeave = (): void => {
      doAfterLeave()
    }
    return {
      rtlEnabled: rtlEnabledRef,
      mergedClsPrefix: mergedClsPrefixRef,
      visible: visibleRef,
      handleCloseClick,
      handleAfterLeave,
      mergedTheme: themeRef,
      cssVars: inlineThemeDisabled ? undefined : cssVarsRef,
      themeClass: themeClassHandle?.themeClass,
      onRender: themeClassHandle?.onRender
    }
  },
  render () {
    this.onRender?.()
    return (
      <NFadeInExpandTransition onAfterLeave={this.handleAfterLeave}>
        {{
          default: () => {
            const { mergedClsPrefix, $slots } = this
            const attrs: HTMLAttributes = {
              class: [
                `${mergedClsPrefix}-alert`,
                this.themeClass,
                this.showIcon && `${mergedClsPrefix}-alert--show-icon`,
                this.rtlEnabled && `${mergedClsPrefix}-alert--rtl`
              ],
              style: this.cssVars as any,
              role: 'alert'
            }
            return this.visible ? (
              <div {...mergeProps(this.$attrs, attrs as any)}>
                {this.closable && (
                  <NBaseClose
                    clsPrefix={mergedClsPrefix}
                    class={`${mergedClsPrefix}-alert__close`}
                    onClick={this.handleCloseClick}
                  />
                )}
                {this.showIcon && (
                  <div
                    class={`${mergedClsPrefix}-alert__icon`}
                    aria-hidden="true"
                  >
                    {resolveSlot($slots.icon, () => [
                      <NBaseIcon clsPrefix={mergedClsPrefix}>
                        {{
                          default: () => {
                            switch (this.type) {
                              case 'success':
                                return <SuccessIcon />
                              case 'info':
                                return <InfoIcon />
                              case 'warning':
                                return <WarningIcon />
                              case 'error':
                                return <ErrorIcon />
                              default:
                                return null
                            }
                          }
                        }}
                      </NBaseIcon>
                    ])}
                  </div>
                )}
                <div class={`${mergedClsPrefix}-alert-body`}>
                  {resolveWrappedSlot($slots.header, (children) => {
                    const mergedChildren = children || this.title
                    return mergedChildren ? (
                      <div class={`${mergedClsPrefix}-alert-body__title`}>
                        {mergedChildren}
                      </div>
                    ) : null
                  })}
                  {$slots.default && (
                    <div class={`${mergedClsPrefix}-alert-body__content`}>
                      {$slots}
                    </div>
                  )}
                </div>
              </div>
            ) : null
          }
        }}
      </NFadeInExpandTransition>
    )
  }
})
