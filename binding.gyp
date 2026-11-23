{
  "targets": [
    {
      "target_name": "windows",
      "conditions": [
        ['OS=="win"', {
          "sources": [
            "src/windows.cc"
          ],
          "defines": [
            "NAPI_VERSION=8"
          ],
          "msvs_configuration_attributes": {
            "SpectreMitigation": "Spectre"
          },
          "msvs_settings": {
            "VCCLCompilerTool": {
              "DebugInformationFormat": 3,
              "AdditionalOptions": [
                "/guard:cf",
                "/sdl",
                "/W3",
                "/we4146",
                "/we4244",
                "/we4267",
                "/ZH:SHA_256"
              ]
            },
            "VCLinkerTool": {
              "GenerateDebugInformation": "true",
              "AdditionalOptions": [
                "/guard:cf",
                "/DYNAMICBASE"
              ]
            }
          },
        }]
      ]
    }
  ]
}
