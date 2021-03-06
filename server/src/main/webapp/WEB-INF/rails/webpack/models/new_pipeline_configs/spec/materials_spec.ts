/*
 * Copyright 2019 ThoughtWorks, Inc.
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

import {DependencyMaterialAttributes, GitMaterialAttributes, HgMaterialAttributes, Material, P4MaterialAttributes, ScmMaterialAttributes, SvnMaterialAttributes, TfsMaterialAttributes} from "../materials";
import {Hg} from "./material_test_data";

describe("Material Types", () => {
  describe("Deserialize", () => {
    it("should deserialize hg material with branch", () => {
      const hgJson               = Hg.withBranch();
      const hgMaterialAttributes = HgMaterialAttributes.fromJSON(hgJson);

      expect(hgMaterialAttributes.branch()).toBe(hgJson.branch);
    });
  });

  describe("Validation", () => {
    it("should should validate Git material attributes", () => {
      const material = new Material("git");

      expect(material.isValid()).toBe(false);
      expect(material.errors().count()).toBe(0);
      expect(material.attributes().errors().count()).toBe(1);
      expect(material.attributes().errors().keys()).toEqual(["url"]);
    });

    it("should should validate SVN material attributes", () => {
      const material = new Material("svn");

      expect(material.isValid()).toBe(false);
      expect(material.errors().count()).toBe(0);
      expect(material.attributes().errors().count()).toBe(1);
      expect(material.attributes().errors().keys()).toEqual(["url"]);
    });

    it("should should validate P4 material attributes", () => {
      const material = new Material("p4");

      expect(material.isValid()).toBe(false);
      expect(material.errors().count()).toBe(0);
      expect(material.attributes().errors().count()).toBe(2);
      expect(material.attributes().errors().keys()).toEqual(["view", "port"]);
      expect(material.attributes().errors().errorsForDisplay("port")).toEqual("Host and port must be present.");
    });

    it("should should validate Hg material attributes", () => {
      const material = new Material("hg");

      expect(material.isValid()).toBe(false);
      expect(material.errors().count()).toBe(0);
      expect(material.attributes().errors().count()).toBe(1);
      expect(material.attributes().errors().keys()).toEqual(["url"]);
    });

    it("should should validate TFS material attributes", () => {
      const material = new Material("tfs");

      expect(material.isValid()).toBe(false);
      expect(material.errors().count()).toBe(0);
      expect(material.attributes().errors().count()).toBe(4);
      expect(material.attributes().errors().keys()).toEqual(["url", "projectPath", "username", "password"]);
    });

    it("should validate name if provided", () => {
      const material         = new Material("git", new GitMaterialAttributes("http://host"));
      const expectedErrorMsg = "Invalid name. This must be alphanumeric and can contain hyphens, underscores and periods (however, it cannot start with a period). The maximum allowed length is 255 characters.";

      expect(material.isValid()).toBe(true);
      material.attributes().name("foo bar baz");

      expect(material.name()).toBe("foo bar baz");
      expect(material.isValid()).toBe(false);
      expect(material.attributes().errors().count()).toBe(1);
      expect(material.attributes().errors().keys()).toEqual(["name"]);
      expect(material.attributes().errors().errorsForDisplay("name")).toBe(expectedErrorMsg);
    });

    it("should validate destination directory if provided", () => {
      const attrs    = new GitMaterialAttributes("http://host");
      const material = new Material("git", attrs);

      assertValidPaths(material, attrs, ["", "foo/bar", "./somepath", "here", "here or there"]);

      assertInvalidPaths(material, attrs, ["..", "../up", ". ", " .", "/root"]);

      function assertValidPaths(material: Material, attrs: ScmMaterialAttributes, paths: string[]) {
        for (const path of paths) {
          attrs.destination(path);
          expect(material.isValid()).toBe(true, `${path} should be valid`);
          expect(attrs.errors().hasErrors("destination")).toBe(false, `${path} should yield no errors`);
        }
      }

      function assertInvalidPaths(material: Material, attrs: ScmMaterialAttributes, paths: string[]) {
        for (const path of paths) {
          attrs.destination(path);
          expect(material.isValid()).toBe(false, `${path} should be invalid`);
          expect(attrs.errors().hasErrors("destination")).toBe(true, `${path} should yield errors`);
          expect(attrs.errors().errorsForDisplay("destination")).toBe("Must be a relative path within the pipeline's working directory.");
        }
      }
    });

    it("should should allow Git SCP-style URLs", () => {
      const material = new Material("git", new GitMaterialAttributes("git@host:repo.git"));

      expect(material.isValid()).toBe(true);
      expect(material.errors().count()).toBe(0);
      expect(material.attributes().isValid()).toBe(true);
      expect(material.attributes().errors().count()).toBe(0);
    });

    it("should should allow SSH URLs", () => {
      const material = new Material("git", new GitMaterialAttributes("ssh://git@host/repo.git"));

      expect(material.isValid()).toBe(true);
      expect(material.errors().count()).toBe(0);
      expect(material.attributes().isValid()).toBe(true);
      expect(material.attributes().errors().count()).toBe(0);
    });

    it("should should validate Git URL credentials", () => {
      const material = new Material("git", new GitMaterialAttributes("http://user:pass@host",
                                                                     "",
                                                                     true,
                                                                     "master",
                                                                     "user",
                                                                     "pass"));

      expect(material.isValid()).toBe(false);
      expect(material.errors().count()).toBe(0);
      expect(material.attributes().errors().count()).toBe(1);
      expect(material.attributes().errors().keys()).toEqual(["url"]);
      expect(material.attributes().errors().errorsForDisplay("url")).toBe("URL credentials must be set in either the URL or the username+password fields, but not both.");
    });

    it("should should validate Hg URL credentials", () => {
      const material = new Material("hg", new HgMaterialAttributes("http://user:pass@host", "", true, "user", "pass"));

      expect(material.isValid()).toBe(false);
      expect(material.errors().count()).toBe(0);
      expect(material.attributes().errors().count()).toBe(1);
      expect(material.attributes().errors().keys()).toEqual(["url"]);
      expect(material.attributes().errors().errorsForDisplay("url")).toBe("URL credentials must be set in either the URL or the username+password fields, but not both.");
    });
  });

  describe("materialUrl()", () => {
    it("should return url for Git material", () => {
      const material = new Material("git", new GitMaterialAttributes("http://foo.bar"));

      expect(material.materialUrl()).toEqual("http://foo.bar");
    });

    it("should return url for Svn material", () => {
      const material = new Material("svn", new SvnMaterialAttributes("svn://127.0.0.1/foo"));

      expect(material.materialUrl()).toEqual("svn://127.0.0.1/foo");
    });

    it("should return url for Hg material", () => {
      const material = new Material("hg", new HgMaterialAttributes("http://foo.bar"));

      expect(material.materialUrl()).toEqual("http://foo.bar");
    });

    it("should return url for P4 material", () => {
      const material = new Material("p4", new P4MaterialAttributes("http://foo.bar:3000", "view"));

      expect(material.materialUrl()).toEqual("http://foo.bar:3000");
    });

    it("should return url for tfs material", () => {
      const material = new Material("tfs", new TfsMaterialAttributes("http://foo.bar", "project/path"));

      expect(material.materialUrl()).toEqual("http://foo.bar");
    });

    it("should return url for dependency material", () => {
      const material = new Material("dependency", new DependencyMaterialAttributes("pipeline", "stage"));

      expect(material.materialUrl()).toEqual("pipeline / stage");
    });

    it("should return blank string in case of unknown type or type is not specified", () => {
      const material = new Material("");

      expect(material.materialUrl()).toEqual("");

      material.type("some random type");
      expect(material.materialUrl()).toEqual("");
    });
  });

  describe("name()", () => {
    it("should return name of material if specified", () => {
      const material = new Material("git", new GitMaterialAttributes("http://foo.bar", "Git material"));

      expect(material.name()).toEqual("Git material");
    });

    it("should return blank string if material name is not specified", () => {
      const material = new Material("git", new GitMaterialAttributes("http://foo.bar"));

      expect(material.name()).toEqual("");
    });
  });

  describe("CloneMaterialAttributes", () => {
    it("should should clone Git material attributes", () => {
      const gitMaterialAttributes = new GitMaterialAttributes("http://foo.git", "git", false, "master", "username", "password", undefined);
      gitMaterialAttributes.destination("destination");

      const clonedAttributes = gitMaterialAttributes.clone();

      expect(clonedAttributes).not.toBe(gitMaterialAttributes);
      expect(clonedAttributes.name()).toEqual(gitMaterialAttributes.name());
      expect(clonedAttributes.url()).toEqual(gitMaterialAttributes.url());
      expect(clonedAttributes.branch()).toEqual(gitMaterialAttributes.branch());
      expect(clonedAttributes.autoUpdate()).toEqual(gitMaterialAttributes.autoUpdate());
      expect(clonedAttributes.username()).toEqual(gitMaterialAttributes.username());
      expect(clonedAttributes.password().value()).toEqual(gitMaterialAttributes.password().value());
      expect(clonedAttributes.destination()).toEqual(gitMaterialAttributes.destination());
    });

    it("should should clone SVN material attributes", () => {
      const svnMaterialAttributes = new SvnMaterialAttributes("http://foo.svn", "svn", false, true, "username", "password", undefined);
      svnMaterialAttributes.destination("destination");

      const clonedAttributes = svnMaterialAttributes.clone();

      expect(clonedAttributes).not.toBe(svnMaterialAttributes);
      expect(clonedAttributes.name()).toEqual(svnMaterialAttributes.name());
      expect(clonedAttributes.url()).toEqual(svnMaterialAttributes.url());
      expect(clonedAttributes.checkExternals()).toEqual(svnMaterialAttributes.checkExternals());
      expect(clonedAttributes.autoUpdate()).toEqual(svnMaterialAttributes.autoUpdate());
      expect(clonedAttributes.username()).toEqual(svnMaterialAttributes.username());
      expect(clonedAttributes.password().value()).toEqual(svnMaterialAttributes.password().value());
      expect(clonedAttributes.destination()).toEqual(svnMaterialAttributes.destination());
    });

    it("should should clone P4 material attributes", () => {
      const p4MaterialAttributes = new P4MaterialAttributes("http://foo.p4:3120", "p4 view", "P4", true, false, "username", "password", undefined);
      p4MaterialAttributes.destination("destination");

      const clonedAttributes = p4MaterialAttributes.clone();

      expect(clonedAttributes).not.toBe(p4MaterialAttributes);
      expect(clonedAttributes.name()).toEqual(p4MaterialAttributes.name());
      expect(clonedAttributes.view()).toEqual(p4MaterialAttributes.view());
      expect(clonedAttributes.useTickets()).toEqual(p4MaterialAttributes.useTickets());
      expect(clonedAttributes.autoUpdate()).toEqual(p4MaterialAttributes.autoUpdate());
      expect(clonedAttributes.username()).toEqual(p4MaterialAttributes.username());
      expect(clonedAttributes.password().value()).toEqual(p4MaterialAttributes.password().value());
      expect(clonedAttributes.destination()).toEqual(p4MaterialAttributes.destination());
    });

    it("should should clone Hg material attributes", () => {
      const hgMaterialAttributes = new HgMaterialAttributes("http://foo.hg", "hg", true, "username", "password", undefined);
      hgMaterialAttributes.destination("destination");

      const clonedAttributes = hgMaterialAttributes.clone();

      expect(clonedAttributes).not.toBe(hgMaterialAttributes);
      expect(clonedAttributes.name()).toEqual(hgMaterialAttributes.name());
      expect(clonedAttributes.url()).toEqual(hgMaterialAttributes.url());
      expect(clonedAttributes.autoUpdate()).toEqual(hgMaterialAttributes.autoUpdate());
      expect(clonedAttributes.username()).toEqual(hgMaterialAttributes.username());
      expect(clonedAttributes.password().value()).toEqual(hgMaterialAttributes.password().value());
      expect(clonedAttributes.destination()).toEqual(hgMaterialAttributes.destination());
    });

    it("should should clone TFS material attributes", () => {
      const tfsMaterialAttributes = new TfsMaterialAttributes("http://foo.tfs", "project/path", "tfs", true, "username", "password", undefined);
      tfsMaterialAttributes.destination("destination");

      const clonedAttributes = tfsMaterialAttributes.clone();

      expect(clonedAttributes).not.toBe(tfsMaterialAttributes);
      expect(clonedAttributes.name()).toEqual(tfsMaterialAttributes.name());
      expect(clonedAttributes.url()).toEqual(tfsMaterialAttributes.url());
      expect(clonedAttributes.projectPath()).toEqual(tfsMaterialAttributes.projectPath());
      expect(clonedAttributes.autoUpdate()).toEqual(tfsMaterialAttributes.autoUpdate());
      expect(clonedAttributes.username()).toEqual(tfsMaterialAttributes.username());
      expect(clonedAttributes.password().value()).toEqual(tfsMaterialAttributes.password().value());
      expect(clonedAttributes.destination()).toEqual(tfsMaterialAttributes.destination());
    });

    it("should should clone Dependency material attributes", () => {
      const dependencyMaterialAttributes = new DependencyMaterialAttributes("pipeline", "stage", "dependency", true);

      const clonedAttributes = dependencyMaterialAttributes.clone();

      expect(clonedAttributes).not.toBe(dependencyMaterialAttributes);
      expect(clonedAttributes.name()).toEqual(dependencyMaterialAttributes.name());
      expect(clonedAttributes.pipeline()).toEqual(dependencyMaterialAttributes.pipeline());
      expect(clonedAttributes.stage()).toEqual(dependencyMaterialAttributes.stage());
      expect(clonedAttributes.autoUpdate()).toEqual(dependencyMaterialAttributes.autoUpdate());
    });
  });

  it("clone()", () => {
    const materialAttributes = new GitMaterialAttributes("url");
    const spyFunction        = spyOn(materialAttributes, "clone");
    const material           = new Material("git", materialAttributes);

    const clonedMaterial = material.clone();

    expect(clonedMaterial).not.toBe(material);
    expect(clonedMaterial.type()).toBe(material.type());
    expect(spyFunction).toHaveBeenCalled();
  });
});
