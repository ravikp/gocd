/*
 * Copyright 2018 ThoughtWorks, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.thoughtworks.go.apiv1.artifactstoreconfig.representers

import com.thoughtworks.go.api.util.GsonTransformer
import com.thoughtworks.go.config.ArtifactStore
import com.thoughtworks.go.domain.packagerepository.ConfigurationPropertyMother
import org.junit.jupiter.api.Test

import static org.assertj.core.api.Assertions.assertThat

class ArtifactStoreRepresenterTest {

  def artifactStore = [
    id          : 'docker',
    plugin_id   : 'cd.go.artifact.docker',
    "properties": [
      [
        "key"  : "RegistryURL",
        "value": "http://foo"
      ]
    ],
  ]

  @Test
  void shouldCreateObjectFromJson() {
    def jsonReader = GsonTransformer.instance.jsonReaderFrom(artifactStore)
    def expectedObject = new ArtifactStore('docker', 'cd.go.artifact.docker', ConfigurationPropertyMother.create('RegistryURL', false, 'http://foo'))
    def object = ArtifactStoreRepresenter.fromJSON(jsonReader)
    assertThat(object).isEqualTo(expectedObject)
  }

}
