{
  "targets": [
    {
      "target_name": "windows",
      "conditions": [
        ['OS=="win"', {
          "sources": [
            "src/windows.cc"
          ],
          "msvs_configuration_attributes": {
            "SpectreMitigation": "Spectre"
          },
          "msvs_settings": {
            "VCCLCompilerTool": {
              "AdditionalOptions": [
                "/guard:cf",
                "/W3",
                "/w34244",
                "/w34267",
                "/ZH:SHA_256"
              ]
            },
            "VCLinkerTool": {
              "AdditionalOptions": [
                "/DYNAMICBASE",
                "/guard:cf"
              ]
            }
          },
        }]
      ]
    }
  ]
}