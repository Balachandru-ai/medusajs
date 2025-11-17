export const theme = {
  "extend": {
    "colors": {
      "ui": {
        "tag": {
          "neutral": {
            "border": {
              "DEFAULT": "var(--tag-neutral-border)"
            },
            "icon": {
              "DEFAULT": "var(--tag-neutral-icon)"
            },
            "text": {
              "DEFAULT": "var(--tag-neutral-text)"
            },
            "bg": {
              "hover": {
                "DEFAULT": "var(--tag-neutral-bg-hover)"
              },
              "DEFAULT": "var(--tag-neutral-bg)"
            }
          },
          "red": {
            "text": {
              "DEFAULT": "var(--tag-red-text)"
            },
            "bg": {
              "DEFAULT": "var(--tag-red-bg)",
              "hover": {
                "DEFAULT": "var(--tag-red-bg-hover)"
              }
            },
            "border": {
              "DEFAULT": "var(--tag-red-border)"
            },
            "icon": {
              "DEFAULT": "var(--tag-red-icon)"
            }
          },
          "blue": {
            "text": {
              "DEFAULT": "var(--tag-blue-text)"
            },
            "border": {
              "DEFAULT": "var(--tag-blue-border)"
            },
            "bg": {
              "DEFAULT": "var(--tag-blue-bg)",
              "hover": {
                "DEFAULT": "var(--tag-blue-bg-hover)"
              }
            },
            "icon": {
              "DEFAULT": "var(--tag-blue-icon)"
            }
          },
          "orange": {
            "border": {
              "DEFAULT": "var(--tag-orange-border)"
            },
            "icon": {
              "DEFAULT": "var(--tag-orange-icon)"
            },
            "bg": {
              "hover": {
                "DEFAULT": "var(--tag-orange-bg-hover)"
              },
              "DEFAULT": "var(--tag-orange-bg)"
            },
            "text": {
              "DEFAULT": "var(--tag-orange-text)"
            }
          },
          "green": {
            "text": {
              "DEFAULT": "var(--tag-green-text)"
            },
            "bg": {
              "hover": {
                "DEFAULT": "var(--tag-green-bg-hover)"
              },
              "DEFAULT": "var(--tag-green-bg)"
            },
            "border": {
              "DEFAULT": "var(--tag-green-border)"
            },
            "icon": {
              "DEFAULT": "var(--tag-green-icon)"
            }
          },
          "purple": {
            "bg": {
              "DEFAULT": "var(--tag-purple-bg)",
              "hover": {
                "DEFAULT": "var(--tag-purple-bg-hover)"
              }
            },
            "text": {
              "DEFAULT": "var(--tag-purple-text)"
            },
            "icon": {
              "DEFAULT": "var(--tag-purple-icon)"
            },
            "border": {
              "DEFAULT": "var(--tag-purple-border)"
            }
          }
        },
        "bg": {
          "switch": {
            "off": {
              "hover": {
                "DEFAULT": "var(--bg-switch-off-hover)"
              },
              "DEFAULT": "var(--bg-switch-off)"
            }
          },
          "field": {
            "component": {
              "hover": {
                "DEFAULT": "var(--bg-field-component-hover)"
              },
              "DEFAULT": "var(--bg-field-component)"
            },
            "DEFAULT": "var(--bg-field)",
            "hover": {
              "DEFAULT": "var(--bg-field-hover)"
            }
          },
          "base": {
            "pressed": {
              "DEFAULT": "var(--bg-base-pressed)"
            },
            "DEFAULT": "var(--bg-base)",
            "hover": {
              "DEFAULT": "var(--bg-base-hover)"
            }
          },
          "highlight": {
            "DEFAULT": "var(--bg-highlight)",
            "hover": {
              "DEFAULT": "var(--bg-highlight-hover)"
            }
          },
          "component": {
            "pressed": {
              "DEFAULT": "var(--bg-component-pressed)"
            },
            "DEFAULT": "var(--bg-component)",
            "hover": {
              "DEFAULT": "var(--bg-component-hover)"
            }
          },
          "interactive": {
            "DEFAULT": "var(--bg-interactive)"
          },
          "subtle": {
            "pressed": {
              "DEFAULT": "var(--bg-subtle-pressed)"
            },
            "hover": {
              "DEFAULT": "var(--bg-subtle-hover)"
            },
            "DEFAULT": "var(--bg-subtle)"
          },
          "disabled": {
            "DEFAULT": "var(--bg-disabled)"
          },
          "overlay": {
            "DEFAULT": "var(--bg-overlay)"
          }
        },
        "border": {
          "menu": {
            "bot": {
              "DEFAULT": "var(--border-menu-bot)"
            },
            "top": {
              "DEFAULT": "var(--border-menu-top)"
            }
          },
          "interactive": {
            "DEFAULT": "var(--border-interactive)"
          },
          "base": {
            "DEFAULT": "var(--border-base)"
          },
          "error": {
            "DEFAULT": "var(--border-error)"
          },
          "danger": {
            "DEFAULT": "var(--border-danger)"
          },
          "strong": {
            "DEFAULT": "var(--border-strong)"
          },
          "transparent": {
            "DEFAULT": "var(--border-transparent)"
          }
        },
        "contrast": {
          "fg": {
            "primary": {
              "DEFAULT": "var(--contrast-fg-primary)"
            },
            "secondary": {
              "DEFAULT": "var(--contrast-fg-secondary)"
            }
          },
          "bg": {
            "base": {
              "pressed": {
                "DEFAULT": "var(--contrast-bg-base-pressed)"
              },
              "DEFAULT": "var(--contrast-bg-base)",
              "hover": {
                "DEFAULT": "var(--contrast-bg-base-hover)"
              }
            },
            "subtle": {
              "DEFAULT": "var(--contrast-bg-subtle)"
            }
          },
          "border": {
            "base": {
              "DEFAULT": "var(--contrast-border-base)"
            },
            "bot": {
              "DEFAULT": "var(--contrast-border-bot)"
            },
            "top": {
              "DEFAULT": "var(--contrast-border-top)"
            }
          }
        },
        "button": {
          "inverted": {
            "pressed": {
              "DEFAULT": "var(--button-inverted-pressed)"
            },
            "hover": {
              "DEFAULT": "var(--button-inverted-hover)"
            },
            "DEFAULT": "var(--button-inverted)"
          },
          "transparent": {
            "DEFAULT": "var(--button-transparent)",
            "hover": {
              "DEFAULT": "var(--button-transparent-hover)"
            },
            "pressed": {
              "DEFAULT": "var(--button-transparent-pressed)"
            }
          },
          "danger": {
            "pressed": {
              "DEFAULT": "var(--button-danger-pressed)"
            },
            "DEFAULT": "var(--button-danger)",
            "hover": {
              "DEFAULT": "var(--button-danger-hover)"
            }
          },
          "neutral": {
            "DEFAULT": "var(--button-neutral)",
            "hover": {
              "DEFAULT": "var(--button-neutral-hover)"
            },
            "pressed": {
              "DEFAULT": "var(--button-neutral-pressed)"
            }
          }
        },
        "fg": {
          "on": {
            "color": {
              "DEFAULT": "var(--fg-on-color)"
            },
            "inverted": {
              "DEFAULT": "var(--fg-on-inverted)"
            }
          },
          "error": {
            "DEFAULT": "var(--fg-error)"
          },
          "subtle": {
            "DEFAULT": "var(--fg-subtle)"
          },
          "base": {
            "DEFAULT": "var(--fg-base)"
          },
          "disabled": {
            "DEFAULT": "var(--fg-disabled)"
          },
          "muted": {
            "DEFAULT": "var(--fg-muted)"
          },
          "interactive": {
            "hover": {
              "DEFAULT": "var(--fg-interactive-hover)"
            },
            "DEFAULT": "var(--fg-interactive)"
          }
        },
        "alpha": {
          "250": {
            "DEFAULT": "var(--alpha-250)"
          },
          "400": {
            "DEFAULT": "var(--alpha-400)"
          }
        }
      }
    },
    "boxShadow": {
      "buttons-danger-focus": "var(--buttons-danger-focus)",
      "details-contrast-on-bg-interactive": "var(--details-contrast-on-bg-interactive)",
      "borders-error": "var(--borders-error)",
      "borders-focus": "var(--borders-focus)",
      "buttons-danger": "var(--buttons-danger)",
      "buttons-inverted-focus": "var(--buttons-inverted-focus)",
      "details-switch-handle": "var(--details-switch-handle)",
      "buttons-neutral": "var(--buttons-neutral)",
      "borders-base": "var(--borders-base)",
      "details-switch-background-focus": "var(--details-switch-background-focus)",
      "details-switch-background": "var(--details-switch-background)",
      "elevation-tooltip": "var(--elevation-tooltip)",
      "borders-interactive-with-focus": "var(--borders-interactive-with-focus)",
      "borders-interactive-with-shadow": "var(--borders-interactive-with-shadow)",
      "borders-interactive-with-active": "var(--borders-interactive-with-active)",
      "elevation-thumbnail": "var(--elevation-thumbnail)",
      "buttons-inverted": "var(--buttons-inverted)",
      "buttons-neutral-focus": "var(--buttons-neutral-focus)",
      "elevation-commandbar": "var(--elevation-commandbar)",
      "elevation-card-rest": "var(--elevation-card-rest)",
      "elevation-flyout": "var(--elevation-flyout)",
      "elevation-code-block": "var(--elevation-code-block)",
      "elevation-modal": "var(--elevation-modal)",
      "elevation-card-hover": "var(--elevation-card-hover)"
    }
  }
}