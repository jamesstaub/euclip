class TrackSerializer
  include JSONAPI::Serializer
  set_key_transform :dash
  attributes :id, :order, :is_master, :filepath
  belongs_to :project
  # in some cases we dont want to return these relationships for the whole list, just a given track
  has_one :init_script, if: Proc.new { |record, params| !params[:relations_only_for] || (params[:relations_only_for] && record == params[:relations_only_for]) } 
  has_one :onstep_script, if: Proc.new { |record, params| !params[:relations_only_for] || (params[:relations_only_for] && record == params[:relations_only_for]) } 
  has_many :track_controls, if: Proc.new { |record, params| !params[:relations_only_for] || (params[:relations_only_for] && record == params[:relations_only_for]) } 
  has_many :sequences, if: Proc.new { |record, params| !params[:relations_only_for] || (params[:relations_only_for] && record == params[:relations_only_for]) } 
end